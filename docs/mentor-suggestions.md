# Sistema de Sugestões de Temas e Áreas

## 📋 Visão Geral

Modal para usuários sugerirem novos temas e áreas de mentoria que gostariam de encontrar na plataforma.

## 🎯 Campos do Formulário

### 1. O que você está procurando? (Obrigatório)
- Textarea livre para descrição detalhada
- Exemplo: "Gostaria de encontrar mentores especializados em Design de Produto, especialmente com experiência em UX Research e acessibilidade digital..."

### 2. Temas ou Áreas (Opcional)
- Input com botão "Adicionar"
- Badges removíveis
- Palavras-chave relacionadas à sugestão

### 3. Tags de Inclusão (Opcional)
- Badges clicáveis (seleção múltipla)
- Tags de diversidade e inclusão disponíveis na plataforma

## 🗄️ Estrutura do Banco de Dados

### Tabela: `mentor_suggestions`

```sql
CREATE TABLE mentor_suggestions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_text TEXT NOT NULL,
  linkedin_url TEXT, -- Mantido para compatibilidade
  knowledge_topics TEXT[], -- Não usado no formulário atual
  free_topics TEXT[],
  inclusion_tags TEXT[],
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);
```

### Status Possíveis
- `pending`: Aguardando revisão
- `reviewing`: Em análise
- `approved`: Aprovada
- `rejected`: Não aprovada
- `contacted`: Profissional contatado (uso futuro)

## 📊 Funções SQL para Análise

```sql
-- Estatísticas gerais
SELECT * FROM get_mentor_suggestions_stats();

-- Temas livres mais sugeridos (insights valiosos!)
SELECT * FROM get_most_suggested_free_topics(20);

-- Tags inclusivas mais solicitadas
SELECT * FROM get_most_suggested_inclusion_tags(10);

-- Usuários mais ativos
SELECT * FROM get_most_active_suggesters(10);
```

## 💡 Insights para Admins

**Temas Livres** são especialmente valiosos porque mostram:
- Gaps na plataforma (temas que não existem)
- Tendências emergentes (ex: IA Generativa)
- Priorização (quais temas adicionar)
- Recrutamento (onde buscar mentores)

## 🚀 Como Usar

### No Código

```tsx
import { SuggestionModal } from "@/components/mentors/SuggestionModal"
import { mentorSuggestionService } from "@/services/mentors/suggestions"

const handleSubmit = async (suggestion) => {
  await mentorSuggestionService.createSuggestion({
    user_id: user.id,
    suggestion_text: suggestion.suggestion_text,
    free_topics: suggestion.free_topics,
    inclusion_tags: suggestion.inclusion_tags,
    knowledge_topics: [] // Não usado
  })
  
  toast.success("Sugestão enviada com sucesso!")
}

<SuggestionModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmit}
  userId={user?.id || null}
/>
```

## 📁 Arquivos Principais

- `components/mentors/SuggestionModal.tsx` - Componente do modal
- `services/mentors/suggestions.ts` - Serviço de gerenciamento
- `types/supabase-mentor-suggestions.ts` - Tipos TypeScript
- `supabase/migrations/create_mentor_suggestions_table.sql` - Tabela e policies
- `supabase/migrations/mentor_suggestions_admin_functions.sql` - Funções SQL

## 🌍 Traduções

Disponível em PT-BR, EN e ES em `i18n/translations/*.json`

Chaves principais:
- `mentorSuggestion.title`
- `mentorSuggestion.description`
- `mentorSuggestion.observationLabel`
- `mentorSuggestion.freeTopicsLabel`
- `mentorSuggestion.inclusionTagsLabel`

## 🔮 Futuro

Para **indicação de pessoas específicas**, criar:
- Nova tabela `mentor_nominations`
- Novo modal "Indicar Profissional"
- Campos: nome, LinkedIn, email, motivo da indicação

## 🔒 Segurança (RLS)

- Usuários podem ver suas próprias sugestões
- Usuários podem criar sugestões
- Usuários podem editar sugestões pendentes
- Admins podem ver e editar todas as sugestões

## 📈 Métricas Sugeridas

- Número de sugestões por semana
- Temas livres mais sugeridos
- Taxa de conversão (sugestões → temas adicionados)
- Tempo médio de resposta
- Satisfação dos usuários
