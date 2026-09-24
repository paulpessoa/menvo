"use client"

import React, { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useFeatureFlag } from "@/lib/feature-flags"
import { Bot, User, Sparkles, Loader2, Info, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MentorCard } from "@/components/mentors/MentorCard"
import { VoiceInput } from "@/components/ui/voice-input"
import { ChipGroup } from "@/components/assistant/ChipGroup"
import { DiagnosticProgressBar } from "@/components/assistant/DiagnosticProgressBar"
import { parseSseLine, type ChipOption } from "@/lib/ai/protocol"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  isStreaming?: boolean
  mentors?: any[]
  chips?: {
    mode: "single" | "multi"
    options: ChipOption[]
    allowOther?: boolean
    canSkip?: boolean
  }
}

interface DiagnosticProgress {
  step: number
  totalSteps: number
  stepName?: string
}

const SUGGESTIONS = [
  "Não sei por onde começar na minha carreira",
  "Quero um mentor para abrir meu próprio negócio",
  "Quero aprender a investir"
]

const LOADING_MESSAGES = [
  "Deixa eu pensar um pouco...",
  "Menvozando...",
  "Consultando as estrelas da mentoria...",
  "Processando sua resposta...",
  "Procurando nas melhores conexões..."
]

function AssistantChat() {
  const isEnabled = useFeatureFlag("ai_assistant_flag")
  const searchParams = useSearchParams()
  const isDiagnosticMode = searchParams.get("mode") === "diagnostic"

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toolActivity, setToolActivity] = useState<string | null>(null)
  const [progress, setProgress] = useState<DiagnosticProgress | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitializedDiagnostic = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, toolActivity])

  // In diagnostic mode, auto-start if no messages exist yet
  useEffect(() => {
    if (isEnabled && isDiagnosticMode && !hasInitializedDiagnostic.current && messages.length === 0) {
      hasInitializedDiagnostic.current = true
      handleSubmit("", "diagnostic")
    }
  }, [isEnabled, isDiagnosticMode, messages.length])

  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Bot className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Assistente em Breve</h1>
        <p className="text-muted-foreground max-w-md">
          Nossa inteligência artificial está sendo treinada para ajudar você a encontrar 
          os melhores mentores e tirar dúvidas sobre sua carreira. Volte em breve!
        </p>
      </div>
    )
  }

  const handleSubmit = async (text: string, overrideMode?: "diagnostic" | "assistant") => {
    if (isLoading) return
    const currentMode = overrideMode || (isDiagnosticMode ? "diagnostic" : "assistant")
    if (!text.trim() && currentMode !== "diagnostic") return

    const userMessageId = Date.now().toString()
    const assistantMessageId = (Date.now() + 1).toString()

    if (text.trim()) {
      setMessages((prev) => [
        ...prev.map((m) => ({ ...m, chips: undefined })), // Clear chips on older messages
        { id: userMessageId, role: "user", text }
      ])
    }

    setInput("")
    setIsLoading(true)
    setToolActivity(null)

    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", text: "", isStreaming: true }
    ])

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          mode: currentMode
        })
      })

      if (res.status === 429) {
        const body = await res.json().catch(() => null)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, text: body?.error ?? "Você atingiu o limite mensal do assistente." }
              : msg
          )
        )
        return
      }

      if (!res.ok) {
        throw new Error(await res.text())
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            const event = parseSseLine(line)
            if (!event || event === "done") continue

            if (event.type === "text") {
              setToolActivity(null)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, text: msg.text + event.text }
                    : msg
                )
              )
            } else if (event.type === "tool_start") {
              const randomMsg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
              setToolActivity(randomMsg)
            } else if (event.type === "mentors_found") {
              setToolActivity(null)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, mentors: event.mentors }
                    : msg
                )
              )
            } else if (event.type === "chips") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        chips: {
                          mode: event.mode,
                          options: event.options,
                          allowOther: event.allowOther,
                          canSkip: event.canSkip
                        }
                      }
                    : msg
                )
              )
            } else if (event.type === "progress") {
              setProgress({
                step: event.step,
                totalSteps: event.totalSteps,
                stepName: event.stepName
              })
            } else if (event.type === "error") {
              setToolActivity(null)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, text: msg.text + "\n❌ " + event.message }
                    : msg
                )
              )
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: "Ocorreu um erro de conexão. Tente novamente." }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setToolActivity(null)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      )
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto border rounded-2xl overflow-hidden bg-background shadow-sm my-6">
      <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">
          {isDiagnosticMode ? "Diagnóstico de Carreira — Menvo" : "Menvo AI Assistant"}
        </h2>
      </div>

      {isDiagnosticMode && progress && (
        <DiagnosticProgressBar
          currentStep={progress.step}
          totalSteps={progress.totalSteps}
          stepName={progress.stepName}
        />
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isDiagnosticMode && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
            <Bot className="w-12 h-12 text-primary" />
            <p>Olá! Como posso ajudar você hoje?</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex flex-col gap-3 w-full max-w-[90%]">
              <div
                className={`w-fit px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm self-end"
                    : "bg-muted rounded-tl-sm self-start"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.isStreaming && !msg.text && (
                  <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                )}
              </div>

              {msg.chips && (
                <ChipGroup
                  mode={msg.chips.mode}
                  options={msg.chips.options}
                  allowOther={msg.chips.allowOther}
                  canSkip={msg.chips.canSkip}
                  disabled={isLoading}
                  onSelect={(val) => handleSubmit(val, "diagnostic")}
                />
              )}

              {msg.mentors && msg.mentors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-2">
                  {msg.mentors.map((mentor: any) => (
                    <MentorCard key={mentor.id} mentor={mentor} isAIHighlighted={true} />
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {toolActivity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-12">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span>{toolActivity}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t">
        {!isDiagnosticMode && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide px-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSubmit(suggestion)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-full border bg-muted/30 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex items-center gap-2 relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isDiagnosticMode
                ? "Digite sua resposta ou use o microfone..."
                : "Pergunte algo ao assistente..."
            }
            className="flex-1 pr-24 rounded-full h-12 bg-muted/50 focus-visible:ring-1"
            disabled={isLoading}
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <VoiceInput
              onTranscript={(transcript) => {
                if (transcript.trim()) {
                  setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
                }
              }}
            />

            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="text-center mt-2 flex justify-center items-center gap-1 text-[10px] text-muted-foreground/70">
          <Info className="w-3 h-3" />
          A IA pode cometer erros. Verifique informações importantes.
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AssistantChat />
    </Suspense>
  )
}
