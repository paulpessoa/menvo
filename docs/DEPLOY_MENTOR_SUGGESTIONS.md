# 🚀 Deploy - Sistema de Sugestões de Mentores

## ✅ Checklist de Deploy

### 1️⃣ Supabase (Backend)

Execute as migrations na ordem:

```bash
# Via Supabase CLI (recomendado)
supabase db push

# Ou execute manualmente no SQL Editor do Supabase:
```

**Arquivos para executar:**
1. `supabase/migrations/create_mentor_suggestions_table.sql`
2. `supabase/migrations/mentor_suggestions_admin_functions.sql`

**O que será criado:**
- ✅ Tabela `mentor_suggestions`
- ✅ View `mentor_suggestions_view`
- ✅ Políticas RLS (Row Level Security)
- ✅ Funções SQL para análise
- ✅ Triggers de atualização

**Verificar se funcionou:**
```sql
-- Deve retornar a estrutura da tabela
SELECT * FROM mentor_suggestions LIMIT 0;

-- Deve retornar estatísticas (vazio inicialmente)
SELECT * FROM get_mentor_suggestions_stats();
```

### 2️⃣ Frontend (Código)

**Arquivos criados/modificados:**
- ✅ `components/mentors/SuggestionModal.tsx` - Modal do formulário
- ✅ `services/mentors/suggestions.ts` - Serviço de API
- ✅ `types/supabase-mentor-suggestions.ts` - Tipos TypeScript
- ✅ `i18n/translations/pt-BR.json` - Traduções PT
- ✅ `i18n/translations/en.json` - Traduções EN
- ✅ `i18n/translations/es.json` - Traduções ES

**Commit e Push:**
```bash
git add .
git commit -m "feat: adiciona sistema de sugestões de temas e áreas de mentoria"
git push origin main
```

### 3️⃣ Integração na Página

Adicione o botão na página de mentores:

```tsx
// Em app/mentors/page.tsx ou similar

import { SuggestionModal } from "@/components/mentors/SuggestionModal"
import { mentorSuggestionService } from "@/services/mentors/suggestions"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Lightbulb } from "lucide-react"

export default function MentorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (suggestion) => {
    try {
      await mentorSuggestionService.createSuggestion({
        user_id: user.id,
        ...suggestion
      })
      
      toast({
        title: t("toast.suggestion.success.title"),
        description: t("toast.suggestion.success.description"),
      })
      
      setIsModalOpen(false)
    } catch (error) {
      toast({
        title: t("toast.suggestion.error.title"),
        description: t("toast.suggestion.error.description"),
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      {/* Botão para abrir modal */}
      <Button onClick={() => setIsModalOpen(true)}>
        <Lightbulb className="h-4 w-4 mr-2" />
        Sugerir Tema
      </Button>

      {/* Modal */}
      <SuggestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        userId={user?.id || null}
      />
    </div>
  )
}
```

## 🧪 Testar

### Teste Manual

1. **Login**: Faça login na plataforma
2. **Abrir Modal**: Clique no botão "Sugerir Tema"
3. **Preencher**:
   - Descrição: "Gostaria de encontrar mentores em IA Generativa"
   - Temas: Adicione "ChatGPT", "Prompt Engineering"
   - Tags: Selecione "Mulheres em Tech"
4. **Enviar**: Clique em "Enviar"
5. **Verificar**: Deve aparecer toast de sucesso

### Verificar no Supabase

```sql
-- Ver sugestões criadas
SELECT * FROM mentor_suggestions_view ORDER BY created_at DESC;

-- Ver temas mais sugeridos
SELECT * FROM get_most_suggested_free_topics(10);
```

## 📊 Monitoramento

### Queries Úteis

```sql
-- Estatísticas gerais
SELECT * FROM get_mentor_suggestions_stats();

-- Sugestões pendentes
SELECT * FROM mentor_suggestions_view 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Temas livres mais sugeridos (insights!)
SELECT * FROM get_most_suggested_free_topics(20);

-- Tags inclusivas mais solicitadas
SELECT * FROM get_most_suggested_inclusion_tags(10);
```

## 🔧 Troubleshooting

### Erro: "relation mentor_suggestions does not exist"
- **Causa**: Migration não foi executada
- **Solução**: Execute `create_mentor_suggestions_table.sql` no Supabase

### Erro: "permission denied for table mentor_suggestions"
- **Causa**: Políticas RLS não configuradas
- **Solução**: Verifique se as policies foram criadas na migration

### Modal não abre
- **Causa**: Usuário não está logado
- **Solução**: Verifique `userId` no componente

### Tags inclusivas não aparecem
- **Causa**: `mentorService.getFilterOptions()` não retorna tags
- **Solução**: Verifique se há mentores com `inclusion_tags` no banco

## 📝 Próximos Passos

1. **Painel Admin**: Criar interface para gerenciar sugestões
2. **Notificações**: Email quando status muda
3. **Dashboard**: Visualizar métricas e tendências
4. **Auto-expansão**: Usar temas livres para expandir lista de tópicos

## 🎉 Pronto!

Após seguir esses passos:
- ✅ Banco de dados configurado
- ✅ Frontend deployado
- ✅ Modal funcionando
- ✅ Dados sendo coletados

Agora é só monitorar as sugestões e usar os insights para melhorar a plataforma!
