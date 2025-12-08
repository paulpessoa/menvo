# Referências a "Voluntariado" no App MENVO

## ✅ Removido

- `components/header.tsx` - volunteerNavigation (removido)
- `components/Contributors.tsx` - Componente inteiro (removido)

---

## 📍 Locais com Referências a Voluntariado

### 1. **Traduções (i18n)**

#### `i18n/translations/pt-BR.json`

- `header.title`: "MENVO - Mentores Voluntários"
- `home.badge.freeMentorship`: "Plataforma de Mentores Voluntários"
- `home.hero.title`: "Conecte-se com Mentores Voluntários"
- `home.hero.description`: "...mentores voluntários para sessões..."
- `home.howItWorks.step1.description`: "...mentores voluntários..."
- `home.featuredMentors.description`: "...mentores voluntários"
- `about.ourImpact.volunteerMentors.label`: "Mentores Voluntários"
- `howItWorks.mentee.step2.description`: "...mentores voluntários..."
- `howItWorks.ngo.step1.description`: "...mentores voluntários..."
- `howItWorks.company.step1.description`: "...mentores voluntários..."
- `faq.q7.answer`: "...mentores voluntários..."
- `register.subtitle`: "...mentores voluntários..."
- `mentors.description`: "...mentores voluntários..."

#### `i18n/translations/en.json` e `es.json`

- Mesmas chaves traduzidas

---

### 2. **Banco de Dados (types/database.ts)**

```typescript
export type UserRole = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"

volunteer_activity_types: { ... }
volunteer_activities: { ... }
```

---

### 3. **Supabase Functions**

#### `supabase/functions/send-quiz-email/index.ts`

- Linha 313: "...mentor voluntário na plataforma MENVO..."
- Linha 353: "...conecta jovens a mentores voluntários..."

#### `supabase/functions/send-invite-email/index.ts`

- Linha 100: "...conecta jovens a mentores voluntários..."
- Linha 117: "Conectar-se com mentores voluntários"

#### `supabase/functions/notify-new-user/index.ts`

- Linha 199: "© MENVO - Mentores Voluntários"

---

### 4. **Scripts de Teste**

#### `scripts/testing/test-volunteer-endpoints.ts`

- Script completo para testar endpoints de volunteer activities
- Testa tabelas: `volunteer_activities`, `volunteer_activity_types`
- Testa coluna: `is_volunteer` na tabela `profiles`

---

### 5. **Hooks**

#### `hooks/useAuth.tsx`

- `isVolunteer`: Verifica se usuário tem role "volunteer"
- Usado no header (agora removido)

---

### 6. **Páginas Relacionadas**

#### Possíveis páginas (não verificadas se existem):

- `/checkin` - Check-in de voluntários
- `/voluntariometro` - Métricas de voluntariado
- `/api/volunteer-activities` - API de atividades
- `/api/volunteer-activities/stats` - Estatísticas

---

## 🎯 Recomendações

### Manter (Faz Sentido)

1. **Traduções sobre "Mentores Voluntários"** - É o conceito central da plataforma
2. **Banco de dados** - Estrutura para futuras funcionalidades
3. **Supabase Functions** - Emails explicando o conceito

### Considerar Remover

1. **UserRole "volunteer"** - Se não está sendo usado
2. **Páginas `/checkin` e `/voluntariometro`** - Se não existem ou não são usadas
3. **Scripts de teste** - Se a funcionalidade não está implementada
4. **`isVolunteer` no useAuth** - Se não é mais necessário

### Atualizar

1. **Traduções** - Trocar "Mentores Voluntários" por apenas "Mentores" se desejar
2. **Emails** - Revisar se a mensagem ainda faz sentido

---

## 📝 Notas

- O conceito de "mentoria voluntária" (gratuita) é diferente de "voluntário" (role/função)
- "Mentores Voluntários" = Mentores que oferecem mentoria gratuita ✅
- "Voluntário" (role) = Pessoa que ajuda a desenvolver a plataforma ❌ (removido)

---

## 🗂️ Arquivos/Pastas Órfãos Encontrados

### Componentes Não Usados

- ✅ `components/VolunteerAccessTest.tsx` - Não importado em nenhum lugar

### Páginas Relacionadas

- ✅ `app/voluntariometro/page.tsx` - Página do voluntariômetro
- ✅ `app/voluntariometro/maps/` - Subpasta
- ✅ `app/voluntariometro/loading.tsx` - Loading state
- ❌ `app/checkin/` - **JÁ REMOVIDA**

### APIs Relacionadas

- ✅ `app/api/volunteer-activities/` - API de atividades de voluntários
- ✅ `app/api/sheetdb/volunteer-hours/` - API para horas de voluntariado

### Ações Recomendadas

1. **Remover** `components/VolunteerAccessTest.tsx` (não usado)
2. **Remover** `app/voluntariometro/` (se não for mais necessário)
3. **Remover** `app/api/volunteer-activities/` (se não for mais necessário)
4. **Remover** `app/api/sheetdb/volunteer-hours/` (se não for mais necessário)

---

**Última Atualização:** Dezembro 2025
