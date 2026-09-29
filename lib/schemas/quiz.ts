import { z } from 'zod';

export const quizFormDataSchema = z.object({
  careerMoment: z.string().min(1, 'Selecione seu momento de carreira'),
  currentChallenge: z.string().trim().min(11, 'Descreva seu desafio com pelo menos 11 caracteres'),
  mentorshipExperience: z.string().min(1, 'Selecione sua experiência anterior'),
  futureVision: z.string().trim().min(11, 'Descreva sua visão com pelo menos 11 caracteres'),
  developmentAreas: z.array(z.string()).min(1, 'Selecione pelo menos uma área de desenvolvimento'),
  developmentAreasOther: z.string().optional(),
  personalLifeHelp: z.string().trim().min(11, 'Descreva com pelo menos 11 caracteres'),
  shareKnowledge: z.string().min(1, 'Selecione sua preferência de compartilhamento'),
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.string().trim().email('Informe um email válido'),
  linkedinUrl: z.string().trim().optional().or(z.literal('')),
});

export type QuizFormData = z.infer<typeof quizFormDataSchema>;

/**
 * Server-side shape of a quiz submission (`POST /api/quiz`), snake_case to
 * match `quiz_responses` Insert columns. Client fields not listed here
 * (ai_analysis, processed_at, score, email_sent...) are never accepted from
 * the request body - the RLS insert policy also rejects them, this is just
 * the first line of defense.
 */
export const quizSubmitSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254),
  linkedin_url: z.string().trim().url().max(300).nullable().optional().or(z.literal('')),
  career_moment: z.string().trim().min(1).max(200),
  mentorship_experience: z.string().trim().min(1).max(200),
  development_areas: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  current_challenge: z.string().trim().min(11).max(4000),
  future_vision: z.string().trim().min(11).max(4000),
  share_knowledge: z.string().trim().min(1).max(200),
  personal_life_help: z.string().trim().min(11).max(4000),
});

export type QuizSubmitPayload = z.infer<typeof quizSubmitSchema>;

export const stepValidation = {
  1: (data: Partial<QuizFormData>) => !!data.careerMoment,
  2: (data: Partial<QuizFormData>) => !!data.currentChallenge && data.currentChallenge.trim().length > 10,
  3: (data: Partial<QuizFormData>) => !!data.mentorshipExperience,
  4: (data: Partial<QuizFormData>) => !!data.futureVision && data.futureVision.trim().length > 10,
  5: (data: Partial<QuizFormData>) => Array.isArray(data.developmentAreas) && data.developmentAreas.length > 0,
  6: (data: Partial<QuizFormData>) => !!data.personalLifeHelp && data.personalLifeHelp.trim().length > 10,
  7: (data: Partial<QuizFormData>) => !!data.shareKnowledge,
  8: (data: Partial<QuizFormData>) => {
    const result = z.object({
      name: z.string().trim().min(2),
      email: z.string().trim().email(),
    }).safeParse(data);
    return result.success;
  },
};
