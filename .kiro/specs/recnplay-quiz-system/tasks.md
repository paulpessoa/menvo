# Implementation Plan

- [x] 1. Set up database schema for quiz responses



  - Create quiz_responses table with all required fields (name, email, linkedin, responses, ai_analysis, score, created_at)
  - Create mentors table with mentor profiles and specialties
  - Set up proper indexes and RLS policies
  - Seed mentors table with current 5 mentors data
  - _Requirements: 1.2, 4.1_




- [ ] 2. Create quiz landing page
  - Set up /quiz route in Next.js app directory
  - Create responsive landing page with hero section and RecnPlay branding
  - Add call-to-action button to start quiz
  - Include information about brindes (caneta/botton) for scores >= 700
  - _Requirements: 1.1, 5.3, 6.1_



- [ ] 3. Build interactive quiz form with 6 questions
- [ ] 3.1 Create quiz form structure and navigation
  - Build QuizForm component with step-by-step navigation


  - Implement progress indicator (1/6, 2/6, etc)
  - Add smooth transitions between questions
  - _Requirements: 1.1, 8.1, 8.2, 8.3, 8.4_

- [ ] 3.2 Implement all 6 quiz questions
  - Q1: Momento de carreira (multiple choice)
  - Q2: Experiência com mentoria (multiple choice)



  - Q3: Áreas de desenvolvimento (multiple choice - múltipla seleção)
  - Q4: Maior desafio profissional (open text)
  - Q5: Visão de futuro 2 anos (open text)
  - Q6: Informações de contato (nome, email, linkedin opcional)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_



- [ ] 3.3 Add form validation and submission
  - Implement validation for required fields
  - Add loading state during submission
  - Save responses to Supabase database

  - Handle errors gracefully
  - _Requirements: 1.2, 5.2_

- [ ] 4. Create OpenAI integration for analysis
- [ ] 4.1 Set up Supabase Edge Function for AI processing
  - Create analyze-quiz Edge Function
  - Integrate OpenAI GPT-4 Completions API


  - Query available mentors from database
  - Pass mentor data to AI prompt
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4.2 Implement scoring and mentor matching logic
  - Create prompt that generates score 0-1000 (most between 700-900)


  - Match user interests with available mentors
  - Return "coming soon" for unavailable mentor types
  - Implement fallback analysis if OpenAI fails
  - _Requirements: 1.4, 2.1, 2.2, 4.2_


- [ ] 5. Build results page with score and recommendations
- [ ] 5.1 Create results page layout
  - Display score prominently (0-1000 scale)
  - Show congratulations badge if score >= 700
  - Add brinde selection section (caneta ou botton) for scores >= 700
  - Display mentor suggestions with availability status
  - Show practical advice and next steps
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2_

- [ ] 5.2 Add MENVO platform invitation CTA
  - Create prominent call-to-action for platform signup
  - Add brief explanation of MENVO benefits
  - Include link to registration page
  - _Requirements: 6.3_

- [ ] 6. Implement automated email system
- [x] 6.1 Create email template with results summary

  - Design responsive HTML email template
  - Include personalized greeting and score
  - Add summary of mentor suggestions
  - Include MENVO invitation link
  - Add instructions for brinde pickup (if applicable)
  - _Requirements: 3.1, 3.2_

- [x] 6.2 Set up email sending via Edge Function

  - Create send-quiz-email Edge Function
  - Configure email service (Resend or similar)
  - Trigger email automatically after quiz completion
  - Handle email failures gracefully
  - _Requirements: 3.1, 3.3_

- [x] 7. Add mobile responsiveness and polish


  - Ensure all pages work perfectly on mobile
  - Add loading animations and transitions
  - Implement error boundaries
  - Test complete user flow end-to-end
  - _Requirements: 5.1, 5.2, 5.3, 5.4_