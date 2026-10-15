/**
 * Colunas de `profiles` que o próprio usuário recebe em /api/auth/me e
 * /api/profile (as duas alimentam o mesmo `profile` do app). Ficam num lugar
 * só porque as duas rotas tinham listas copiadas, e em 01/10 `is_public`
 * sumiu delas: o formulário de perfil abria com "Perfil público" desligado e
 * cada "Salvar" tirava o mentor do catálogo sem ele perceber.
 */
export const OWN_PROFILE_COLUMNS =
  "id, email, first_name, last_name, full_name, avatar_url, slug, bio, expertise_areas, linkedin_url, created_at, updated_at, city, state, country, timezone, languages, job_title, company, mentorship_topics, github_url, website_url, phone, portfolio_url, onboarding_flags, is_public" as const
