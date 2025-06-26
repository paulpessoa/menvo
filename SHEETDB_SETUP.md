# Configuração do SheetDB

Este projeto utiliza o SheetDB para armazenar as horas de voluntariado em uma planilha do Google Sheets.

## ✅ Configuração Necessária

As credenciais do SheetDB devem estar configuradas nas variáveis de ambiente:

### Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```env
# SheetDB Configuration
SHEETDB_API_URL=https://sheetdb.io/api/v1/YOUR_SHEET_ID
SHEETDB_API_KEY=your-api-key-if-required
```

## Estrutura da Planilha

A planilha deve ter a seguinte estrutura na primeira linha:

| id | name | email | date | hours | activity | description | created_at |
|----|------|-------|------|-------|----------|-------------|------------|
| 1 | João Silva | joao@email.com | 2024-01-15 | 2.5 | Mentoria | Ajudou com React | 2024-01-15T10:30:00Z |

### Colunas Necessárias:

- `id` (será preenchido automaticamente pelo SheetDB)
- `name` (nome do voluntário)
- `email` (email do voluntário)
- `date` (data do voluntariado - formato YYYY-MM-DD)
- `hours` (número de horas)
- `activity` (atividade realizada)
- `description` (descrição opcional)
- `created_at` (data de criação - será preenchido automaticamente)

## Funcionalidades

### Página de Check-in (`/checkin`)
- Formulário para registrar horas de voluntariado
- Validação de campos obrigatórios
- Integração com SheetDB via API

### Página do Voluntariômetro (`/voluntariometro`)
- Listagem de todas as horas registradas
- **Filtro por voluntário específico** (novo!)
- Filtro por nome/email
- Ordenação por nome (A-Z) ou quantidade de horas
- Estatísticas gerais
- Ranking dos top 5 voluntários
- Botão para limpar filtros

## Endpoints da API

### GET `/api/sheetdb/volunteer-hours`
Retorna todas as horas de voluntariado registradas.

### POST `/api/sheetdb/volunteer-hours`
Registra uma nova hora de voluntariado.

**Body:**
```json
{
  "name": "Nome do Voluntário",
  "email": "email@exemplo.com",
  "date": "2024-01-15",
  "hours": 2.5,
  "activity": "Mentoria",
  "description": "Descrição opcional"
}
```

## Hooks React Query

### `useVolunteerHours()`
Hook para buscar todas as horas de voluntariado.

### `useCreateVolunteerHour()`
Hook para criar uma nova hora de voluntariado.

### `useVolunteerHoursWithFilters(filters)`
Hook para buscar horas com filtros e ordenação.

**Parâmetros:**
- `person`: string - Filtro por nome ou email
- `sortBy`: 'name' | 'hours' - Campo para ordenação
- `sortOrder`: 'asc' | 'desc' - Ordem da ordenação

## Exemplo de uso

```typescript
import { useVolunteerHoursWithFilters } from '@/hooks/api/use-volunteer-hours';

function MyComponent() {
  const { data, isLoading } = useVolunteerHoursWithFilters({
    person: 'João',
    sortBy: 'hours',
    sortOrder: 'desc'
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>
          {item.name} - {item.hours}h
        </div>
      ))}
    </div>
  );
}
```

## Testando a Integração

1. **Configure as variáveis de ambiente** no `.env.local`
2. **Acesse** `/checkin` e tente registrar uma hora de voluntariado
3. **Verifique** se os dados aparecem na planilha do Google Sheets
4. **Acesse** `/voluntariometro` para ver a listagem
5. **Teste** os filtros por voluntário e ordenação

## Troubleshooting

Se houver problemas:

1. **Verifique** se as variáveis de ambiente estão configuradas
2. **Confirme** se a planilha tem as colunas corretas
3. **Teste** se as permissões do SheetDB estão corretas
4. **Verifique** os logs do console para erros 