# Instruções para Aplicar Migration - Renomear Campos de Notas

## Contexto
Os campos de notas dos appointments foram renomeados para uma nomenclatura mais semântica:
- `comments` → `notes_mentee` (notas/comentários do mentee)
- `mentor_notes` → `notes_mentor` (notas/comentários do mentor)

## Migration Criada
📁 `supabase/migrations/20251101000003_rename_to_notes_mentee_mentor.sql`

## Como Aplicar

### Opção 1: Via Supabase CLI (Recomendado)
```bash
# Aplicar a migration
supabase db push

# Ou aplicar migration específica
supabase migration up
```

### Opção 2: Via SQL Editor no Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o seguinte SQL:

```sql
-- Renomear 'comments' para 'notes_mentee'
ALTER TABLE public.appointments 
RENAME COLUMN comments TO notes_mentee;

-- Renomear 'mentor_notes' para 'notes_mentor'
ALTER TABLE public.appointments 
RENAME COLUMN mentor_notes TO notes_mentor;

-- Atualizar comentários das colunas
COMMENT ON COLUMN public.appointments.notes_mentee IS 'Comentários/mensagem do mentee ao solicitar a mentoria';
COMMENT ON COLUMN public.appointments.notes_mentor IS 'Anotações do mentor ao confirmar a mentoria';
```

## Arquivos Atualizados

### Tipos
- ✅ `types/appointments.ts` - Interface Appointment atualizada

### APIs
- ✅ `app/api/appointments/create/route.ts` - Criação de appointments
- ✅ `app/api/appointments/confirm/route.ts` - Confirmação de appointments
- ✅ `app/api/appointments/schedule/route.ts` - Agendamento de appointments
- ✅ `app/api/appointments/[id]/route.ts` - Atualização de appointments
- ✅ `app/api/appointments/action/route.ts` - Ações em appointments

### Componentes
- ✅ `components/appointments/appointment-card.tsx` - Card de appointment
- ✅ `components/appointments/confirm-appointment-button.tsx` - Botão de confirmação

## Verificação Pós-Migration

Após aplicar a migration, verifique:

1. **Teste de Criação**: Crie um novo appointment como mentee
   - Verifique se `notes_mentee` é salvo corretamente

2. **Teste de Confirmação**: Confirme um appointment como mentor
   - Adicione observações e verifique se `notes_mentor` é salvo

3. **Teste de Visualização**: Visualize appointments existentes
   - Verifique se as notas aparecem corretamente nos cards

4. **Teste de API**: Faça uma chamada GET para listar appointments
   ```bash
   curl -X GET "http://localhost:3000/api/appointments/list?role=mentor&status=pending"
   ```
   - Verifique se os campos `notes_mentee` e `notes_mentor` estão presentes

## Rollback (Se Necessário)

Se precisar reverter as mudanças:

```sql
-- Reverter renomeação
ALTER TABLE public.appointments 
RENAME COLUMN notes_mentee TO comments;

ALTER TABLE public.appointments 
RENAME COLUMN notes_mentor TO mentor_notes;
```

## Benefícios da Nova Nomenclatura

✨ **Mais Semântico**: `notes_mentee` e `notes_mentor` deixam claro quem escreveu cada nota
✨ **Consistente**: Segue o padrão de nomenclatura do banco (snake_case)
✨ **Autodocumentado**: Não precisa de comentários adicionais para entender o propósito
✨ **Escalável**: Facilita adicionar novos campos relacionados no futuro
