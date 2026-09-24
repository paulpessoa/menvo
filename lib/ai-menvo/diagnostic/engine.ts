import type { SupabaseClient, User } from "@supabase/supabase-js"
import { consumeAiQuota, getAiQuota } from "@/lib/ai/quota"
import type { AiCallRecord } from "@/lib/ai/metering"
import type { AiEvent } from "@/lib/ai/protocol"
import { diagnosticService } from "@/lib/services/diagnostic/diagnostic.service"
import { assistantTools } from "@/lib/services/assistant/tools"
import { analyzeQuiz, type AnalysisMentor, type QuizAnswers } from "./analyze"
import { DIAGNOSTIC_STEPS, TOTAL_DIAGNOSTIC_STEPS } from "./steps"
import { extractCareerMoment, extractDevelopmentAreas, checkCrisisTrigger, CRISIS_SAFEGUARD_MESSAGE } from "./extract"
import { isAnswerTooVague, generateFollowupQuestion } from "./followup"
import type { DiagnosticState, DiagnosticStepId } from "./types"

export interface ProcessDiagnosticOptions {
  onCall: (record: AiCallRecord) => void
  emit: (event: AiEvent) => void
}

/**
 * Emits text in natural streaming chunks with micro-delays
 * to provide a smooth, lifelike typewriter streaming effect over SSE.
 */
async function streamText(text: string, emit: (event: AiEvent) => void, delayMs = 12): Promise<void> {
  const chunks = text.match(/\S+\s*|\s+/g) || [text]
  for (const chunk of chunks) {
    emit({ type: "text", text: chunk })
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Orchestrates a conversational turn of the diagnostic flow.
 * Emits typed SSE events (progress, text, chips, diagnostic_complete, mentors_found).
 */
export async function processDiagnosticTurn(
  supabase: SupabaseClient,
  user: User,
  userInput: string,
  options: ProcessDiagnosticOptions
): Promise<void> {
  const { emit, onCall } = options
  const trimmedInput = userInput.trim()

  // 1. Check or retrieve active session
  let session = await diagnosticService.getActiveSession(supabase, user.id)

  if (!session) {
    // Check quota entitlement before creating a new session
    const quota = await getAiQuota(supabase, "diagnostic").catch(() => null)
    const isLimited = quota && quota.limit !== null && quota.remaining !== null && quota.remaining <= 0

    if (isLimited) {
      const latest = await diagnosticService.getLatestCompletedSession(supabase, user.id)
      const reportUrl = latest?.quiz_response_id ? `/quiz/results/${latest.quiz_response_id}` : null

      const ratingMatch = trimmedInput.match(/(?:nota\s*|estrelas?\s*|aval(?:iação|io)?\s*:?\s*)?([1-5])/i)
      const isFeedbackIntent =
        Boolean(ratingMatch) ||
        /gostei|excelente|ótimo|bom|ajudou|melhorar|parabéns|adorei|obrigad/i.test(trimmedInput)

      if (isFeedbackIntent && trimmedInput.length > 0) {
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 5
        await assistantTools.saveFeedback(supabase, {
          rating,
          comment: trimmedInput,
          source: "diagnostic",
          context: {
            session_id: latest?.id,
            quiz_response_id: latest?.quiz_response_id
          }
        }).catch((err) => console.error("Erro ao gravar feedback de diagnóstico:", err))

        await streamText(
          "Muito obrigado pela sua avaliação! Seu feedback foi registrado com sucesso e nos ajuda a aprimorar o Diagnóstico da Menvo continuamente. 🌟\n\n" +
          "Você pode consultar seu relatório detalhado a qualquer momento:",
          emit,
          10
        )

        if (reportUrl) {
          emit({
            type: "chips",
            mode: "single",
            options: [
              { label: "📄 Ver Relatório Completo", value: `link:${reportUrl}` },
              { label: "💬 Conversar com o Copiloto", value: "mode:assistant" }
            ]
          })
        }
        return
      }

      await streamText(
        "Você já realizou o seu diagnóstico gratuito de carreira neste mês! " +
        "Seu próximo diagnóstico gratuito estará disponível no início do próximo mês." +
        (reportUrl ? "\n\nVocê pode rever a sua análise anterior acessando seu relatório completo:" : ""),
        emit,
        10
      )

      if (reportUrl) {
        emit({
          type: "chips",
          mode: "single",
          options: [
            { label: "Ver Relatório do Diagnóstico", value: `link:${reportUrl}` }
          ]
        })
      }
      return
    }

    // Create a new session
    session = await diagnosticService.createSession(supabase, user.id)
    const step1 = DIAGNOSTIC_STEPS[1]

    emit({
      type: "progress",
      step: 1,
      totalSteps: TOTAL_DIAGNOSTIC_STEPS,
      stepName: step1.name
    })

    await streamText(
      "Olá! Boas-vindas ao Diagnóstico de Carreira da Menvo. " +
      "Vou te fazer 7 perguntas rápidas para entender seu momento e recomendar os mentores ideais para você.\n\n" +
      step1.questionText,
      emit,
      10
    )

    if (step1.chipOptions) {
      emit({
        type: "chips",
        mode: "single",
        options: step1.chipOptions,
        allowOther: step1.allowOther
      })
    }
    return
  }

  // 2. We have an active in-progress session
  const state: DiagnosticState = session.state || {
    currentStep: (session.current_step as DiagnosticStepId) || 1,
    answers: {},
    followups: {}
  }
  const currentStep = state.currentStep

  // Support restarting diagnostic
  if (trimmedInput.toLowerCase() === "reiniciar" || trimmedInput.toLowerCase() === "refazer") {
    state.currentStep = 1
    state.answers = {}
    state.followups = {}
    state.isAwaitingFollowup = false
    await diagnosticService.updateSessionState(supabase, session.id, state, 1)
    const step1 = DIAGNOSTIC_STEPS[1]
    emit({
      type: "progress",
      step: 1,
      totalSteps: TOTAL_DIAGNOSTIC_STEPS,
      stepName: step1.name
    })
    await streamText(
      "Vamos tentar novamente com mais calma! " + step1.questionText,
      emit,
      10
    )
    if (step1.chipOptions) {
      emit({
        type: "chips",
        mode: "single",
        options: step1.chipOptions,
        allowOther: step1.allowOther
      })
    }
    return
  }

  // If user passed empty input on an active session, re-prompt current step
  if (!trimmedInput) {
    const stepDef = DIAGNOSTIC_STEPS[currentStep]
    emit({
      type: "progress",
      step: currentStep,
      totalSteps: TOTAL_DIAGNOSTIC_STEPS,
      stepName: stepDef.name
    })
    await streamText(stepDef.questionText, emit, 10)
    if (stepDef.chipOptions) {
      emit({
        type: "chips",
        mode: stepDef.inputType === "multi_choice" ? "multi" : "single",
        options: stepDef.chipOptions,
        allowOther: stepDef.allowOther,
        canSkip: stepDef.canSkip
      })
    }
    return
  }

  // 3. Process answer according to currentStep & followup status
  if (state.isAwaitingFollowup) {
    // User answered the follow-up question
    if (currentStep === 2) {
      state.answers.current_challenge = `${state.answers.current_challenge || ""}. Detalhes: ${trimmedInput}`
      state.followups.challenge = (state.followups.challenge || 0) + 1
    } else if (currentStep === 4) {
      state.answers.future_vision = `${state.answers.future_vision || ""}. Detalhes: ${trimmedInput}`
      state.followups.vision = (state.followups.vision || 0) + 1
    }
    state.isAwaitingFollowup = false
    await advanceToNextStep(supabase, session.id, state, currentStep, user, options)
    return
  }

  // Regular step processing
  switch (currentStep) {
    case 1: {
      const match = DIAGNOSTIC_STEPS[1].chipOptions?.find((o) => o.value === trimmedInput)
      if (match && match.value !== "outro") {
        state.answers.career_moment = match.value
      } else {
        state.answers.career_moment = await extractCareerMoment(supabase, trimmedInput, { onCall })
      }
      await advanceToNextStep(supabase, session.id, state, 1, user, options)
      break
    }

    case 2: {
      if (checkCrisisTrigger(trimmedInput)) {
        emit({ type: "text", text: CRISIS_SAFEGUARD_MESSAGE })
        return
      }

      if (isAnswerTooVague(trimmedInput) && !state.followups.challenge) {
        state.answers.current_challenge = trimmedInput
        state.isAwaitingFollowup = true
        await diagnosticService.updateSessionState(supabase, session.id, state, 2)

        const followupQuestion = await generateFollowupQuestion(
          supabase,
          DIAGNOSTIC_STEPS[2].questionText,
          trimmedInput,
          { onCall }
        )
        emit({ type: "text", text: followupQuestion })
        return
      }

      state.answers.current_challenge = trimmedInput
      await advanceToNextStep(supabase, session.id, state, 2, user, options)
      break
    }

    case 3: {
      const match = DIAGNOSTIC_STEPS[3].chipOptions?.find((o) => o.value === trimmedInput)
      state.answers.mentorship_experience = match ? match.value : "nao-sei"
      await advanceToNextStep(supabase, session.id, state, 3, user, options)
      break
    }

    case 4: {
      if (isAnswerTooVague(trimmedInput) && !state.followups.vision) {
        state.answers.future_vision = trimmedInput
        state.isAwaitingFollowup = true
        await diagnosticService.updateSessionState(supabase, session.id, state, 4)

        const followupQuestion = await generateFollowupQuestion(
          supabase,
          DIAGNOSTIC_STEPS[4].questionText,
          trimmedInput,
          { onCall }
        )
        emit({ type: "text", text: followupQuestion })
        return
      }

      state.answers.future_vision = trimmedInput
      await advanceToNextStep(supabase, session.id, state, 4, user, options)
      break
    }

    case 5: {
      // Input may be JSON array string or comma separated
      try {
        const parsed = JSON.parse(trimmedInput)
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.answers.development_areas = parsed
          await advanceToNextStep(supabase, session.id, state, 5, user, options)
          return
        }
      } catch {
        // Not a JSON array, treat as free text or comma-separated
      }

      const extracted = await extractDevelopmentAreas(supabase, trimmedInput, { onCall })
      state.answers.development_areas = extracted.areas
      if (extracted.other) state.answers.development_areas_other = extracted.other
      await advanceToNextStep(supabase, session.id, state, 5, user, options)
      break
    }

    case 6: {
      if (trimmedInput === "skip" || trimmedInput === "pular") {
        state.answers.personal_life_help = undefined
      } else {
        if (checkCrisisTrigger(trimmedInput)) {
          emit({ type: "text", text: CRISIS_SAFEGUARD_MESSAGE })
          return
        }
        state.answers.personal_life_help = trimmedInput
      }
      await advanceToNextStep(supabase, session.id, state, 6, user, options)
      break
    }

    case 7: {
      const match = DIAGNOSTIC_STEPS[7].chipOptions?.find((o) => o.value === trimmedInput)
      state.answers.share_knowledge = match ? match.value : "nao-pensou"
      await advanceToNextStep(supabase, session.id, state, 7, user, options)
      break
    }
  }
}

/**
 * Advances to the next question or triggers final analysis if all 7 steps are answered.
 */
async function advanceToNextStep(
  supabase: SupabaseClient,
  sessionId: string,
  state: DiagnosticState,
  fromStep: DiagnosticStepId,
  user: User,
  options: ProcessDiagnosticOptions
): Promise<void> {
  const { emit, onCall } = options

  if (fromStep < TOTAL_DIAGNOSTIC_STEPS) {
    const nextStep = (fromStep + 1) as DiagnosticStepId
    state.currentStep = nextStep
    await diagnosticService.updateSessionState(supabase, sessionId, state, nextStep)

    const stepDef = DIAGNOSTIC_STEPS[nextStep]
    emit({
      type: "progress",
      step: nextStep,
      totalSteps: TOTAL_DIAGNOSTIC_STEPS,
      stepName: stepDef.name
    })

    const text = stepDef.descriptionText
      ? `${stepDef.questionText}\n\n${stepDef.descriptionText}`
      : stepDef.questionText

    await streamText(text, emit, 10)

    if (stepDef.chipOptions) {
      emit({
        type: "chips",
        mode: stepDef.inputType === "multi_choice" ? "multi" : "single",
        options: stepDef.chipOptions,
        allowOther: stepDef.allowOther,
        canSkip: stepDef.canSkip
      })
    }
    return
  }

  // Final Step: Complete Diagnostic and generate analysis
  // Persist latest answers (step 7) to avoid losing them on transient errors
  await diagnosticService.updateSessionState(supabase, sessionId, state, TOTAL_DIAGNOSTIC_STEPS)

  emit({
    type: "progress",
    step: TOTAL_DIAGNOSTIC_STEPS,
    totalSteps: TOTAL_DIAGNOSTIC_STEPS,
    stepName: "Análise com IA em andamento"
  })

  await streamText(
    "Excelente! Respostas registradas com sucesso. Estou analisando seu momento de carreira e buscando os mentores mais adequados para o seu perfil...\n\n",
    emit,
    10
  )

  emit({
    type: "tool_start",
    name: "Validando cota de diagnóstico..."
  })

  // 1. Quota check: read-only check first
  const quotaCheck = await getAiQuota(supabase, "diagnostic")
  if (!quotaCheck.allowed) {
    emit({
      type: "error",
      message:
        quotaCheck.reason === "budget"
          ? "O limite mensal de processamento por IA da plataforma foi atingido. Seu diagnóstico foi salvo e será processado em breve."
          : "Você já atingiu seu limite de diagnósticos para este mês."
    })
    return
  }

  emit({
    type: "tool_start",
    name: "Analisando seu momento de carreira com IA..."
  })

  // 2. Run analysis
  const profileName = user.user_metadata?.full_name || "Mentorado"
  const MENTOR_SELECT_FIELDS =
    "id, full_name, slug, avatar_url, bio, job_title, company, city, state, country, languages, inclusive_tags, expertise_areas, mentor_skills, mentorship_topics, availability_status, average_rating, total_reviews, total_sessions, experience_years"

  let { data: mentorRows } = await supabase
    .from("mentors_view")
    .select(MENTOR_SELECT_FIELDS)
    .eq("verified", true)
    .eq("is_public", true)
    .limit(50)

  if (!mentorRows || mentorRows.length === 0) {
    const { data: allMentors } = await supabase
      .from("mentors_view")
      .select(MENTOR_SELECT_FIELDS)
      .limit(50)
    mentorRows = allMentors
  }

  const mentors = (mentorRows ?? []) as unknown as AnalysisMentor[]

  const answers: QuizAnswers = {
    name: profileName,
    career_moment: state.answers.career_moment || "outro",
    current_challenge: state.answers.current_challenge || "",
    mentorship_experience: state.answers.mentorship_experience || "nao-sei",
    future_vision: state.answers.future_vision || "",
    development_areas: state.answers.development_areas || ["Planejamento de carreira"],
    share_knowledge: state.answers.share_knowledge || "nao-pensou",
    personal_life_help: state.answers.personal_life_help || ""
  }

  const { analysis } = await analyzeQuiz(supabase, answers, mentors, { onCall })

  // Only consume quota if the analysis succeeded and does not require redoing
  if (!analysis.precisa_refazer) {
    await consumeAiQuota(supabase, "diagnostic")
  }

  emit({
    type: "tool_start",
    name: "Buscando mentores compatíveis no catálogo..."
  })

  // 3. Resolve recommended mentor cards (from analysis suggestions, skills match, or top rated)
  const recommendedCards: any[] = []
  const usedMentorIds = new Set<string>()

  // A. Priority: mentors identified by name in analysis.mentores_sugeridos
  if (analysis.mentores_sugeridos && mentorRows) {
    for (const s of analysis.mentores_sugeridos) {
      if (s.mentor_nome) {
        const found = mentorRows.find(
          (m: any) =>
            m.full_name?.toLowerCase().trim() === s.mentor_nome.toLowerCase().trim() &&
            !usedMentorIds.has(m.id)
        )
        if (found) {
          usedMentorIds.add(found.id)
          recommendedCards.push(found)
        }
      }
    }
  }

  // B. Fill up to 3 mentors by matching development areas with topics/skills/bio
  if (recommendedCards.length < 3 && mentorRows && mentorRows.length > 0) {
    const devAreas = (state.answers.development_areas || []).map((a: string) => a.toLowerCase())
    const scored = mentorRows
      .filter((m: any) => !usedMentorIds.has(m.id))
      .map((m: any) => {
        const textToMatch = [
          ...(m.expertise_areas || []),
          ...(m.mentorship_topics || []),
          ...(m.mentor_skills || []),
          m.job_title || "",
          m.bio || ""
        ]
          .join(" ")
          .toLowerCase()

        let score = 0
        for (const area of devAreas) {
          if (textToMatch.includes(area) || area.split(/\s+/).some((w) => w.length > 3 && textToMatch.includes(w))) {
            score += 2
          }
        }
        if (m.availability_status === "available") score += 1
        score += (m.average_rating || 0) * 0.5
        return { mentor: m, score }
      })
      .sort((a, b) => b.score - a.score)

    for (const item of scored) {
      if (recommendedCards.length >= 3) break
      usedMentorIds.add(item.mentor.id)
      recommendedCards.push(item.mentor)
    }
  }

  // C. Fallback: try assistantTools.searchMentors
  if (recommendedCards.length === 0) {
    const searchResults = await assistantTools.searchMentors(supabase, { query: "carreira", limit: 3 })
    if (searchResults.forCard && searchResults.forCard.length > 0) {
      recommendedCards.push(...searchResults.forCard)
    }
  }

  emit({
    type: "tool_start",
    name: "Salvando seu diagnóstico e preparando recomendações..."
  })

  // 4. Save to database
  const { quizResponseId } = await diagnosticService.completeDiagnostic(
    supabase,
    sessionId,
    user.id,
    state.answers,
    analysis
  )

  // 5. Emit completion and results
  emit({
    type: "diagnostic_complete",
    responseId: quizResponseId,
    analysis: analysis as unknown as Record<string, unknown>
  })

  if (recommendedCards.length > 0) {
    emit({
      type: "mentors_found",
      mentors: recommendedCards
    })
  }

  // 6. Build final text including explicit mentor recommendations and practical advice
  const mentorSuggestionsText =
    analysis.mentores_sugeridos && analysis.mentores_sugeridos.length > 0
      ? `\n\n**Mentores Recomendados para seu Momento:**\n` +
        analysis.mentores_sugeridos
          .map((m: any) => {
            const nomeStr = m.mentor_nome ? ` (${m.mentor_nome})` : ""
            const statusStr = m.disponivel ? " — *Agenda disponível*" : ""
            return `• **${m.tipo}**${nomeStr}${statusStr}: ${m.razao}`
          })
          .join("\n")
      : ""

  const conselhosText =
    analysis.conselhos_praticos && analysis.conselhos_praticos.length > 0
      ? `\n\n**Conselhos Práticos:**\n` +
        analysis.conselhos_praticos.map((c: string) => `• ${c}`).join("\n")
      : ""

  const proximosPassosText =
    analysis.proximos_passos && analysis.proximos_passos.length > 0
      ? `\n\n**Próximos Passos recomendados:**\n` +
        analysis.proximos_passos.map((p: string) => `• ${p}`).join("\n")
      : ""

  const finalText =
    `---\n\n` +
    `🎉 **${analysis.titulo_personalizado}**\n\n` +
    `${analysis.resumo_motivador}` +
    mentorSuggestionsText +
    conselhosText +
    proximosPassosText +
    `\n\n${analysis.mensagem_final}`

  await streamText(finalText, emit, 15)

  if (analysis.precisa_refazer) {
    emit({
      type: "chips",
      mode: "single",
      options: [
        { label: "Refazer diagnóstico agora", value: "reiniciar" }
      ]
    })
  } else if (quizResponseId) {
    const feedbackPrompt =
      `\n\n---\n` +
      `**Esse diagnóstico te ajudou?** Deixe sua avaliação abaixo para continuarmos aprimorando a Menvo!`
    await streamText(feedbackPrompt, emit, 10)

    emit({
      type: "chips",
      mode: "single",
      options: [
        { label: "📄 Ver Relatório Completo", value: `link:/quiz/results/${quizResponseId}` },
        { label: "⭐ 5 - Excelente!", value: "Minha avaliação do diagnóstico é nota 5: excelente!" },
        { label: "⭐ 4 - Muito bom", value: "Minha avaliação do diagnóstico é nota 4: muito bom!" },
        { label: "⭐ 3 - Regular", value: "Minha avaliação do diagnóstico é nota 3: regular." }
      ]
    })
  }
}
