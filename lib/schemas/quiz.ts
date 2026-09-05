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
