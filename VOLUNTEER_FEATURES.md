# Funcionalidades de Voluntariado

Este projeto inclui um sistema completo para gerenciar horas de voluntariado, permitindo que voluntários registrem suas atividades e que a comunidade acompanhe as contribuições.

## Páginas Criadas

### 1. Página de Check-in (`/checkin`)

**Funcionalidades:**
- Formulário completo para registro de horas de voluntariado
- Validação de campos obrigatórios usando Zod
- Seletor de data com calendário
- Campo numérico para horas (0.5 a 24 horas)
- Campo de atividade com sugestões
- Campo opcional de descrição
- Feedback visual de sucesso/erro
- Loading state durante o envio

**Campos do formulário:**
- Nome completo (obrigatório)
- Email (obrigatório)
- Data do voluntariado (obrigatório)
- Horas trabalhadas (obrigatório, 0.5-24h)
- Atividade realizada (obrigatório)
- Descrição (opcional)

### 2. Página do Voluntariômetro (`/voluntariometro`)

**Funcionalidades:**
- Dashboard com estatísticas gerais
- Listagem completa de registros
- **Filtro por voluntário específico** (select com lista de voluntários)
- Filtro por nome/email (busca por texto)
- Ordenação por nome (A-Z) ou quantidade de horas
- Ranking dos top 5 voluntários
- Contador de resultados
- Botão para limpar filtros
- Estados de loading e erro

**Estatísticas exibidas:**
- Total de horas de voluntariado
- Número de voluntários únicos
- Total de atividades realizadas
- Média de horas por voluntário

**Filtros disponíveis:**
- **Por voluntário**: Select com lista de todos os voluntários únicos
- **Por texto**: Busca por nome ou email
- **Ordenação**: Por nome (A-Z) ou quantidade de horas (crescente/decrescente)

## API Endpoints

### `/api/sheetdb/volunteer-hours`

**GET** - Lista todas as horas de voluntariado
**POST** - Registra uma nova hora de voluntariado

**Estrutura dos dados:**
```typescript
interface VolunteerHour {
  id?: string;
  name: string;
  email: string;
  date: string; // YYYY-MM-DD
  hours: number;
  activity: string;
  description?: string;
  created_at?: string;
}
```

## Hooks React Query

### `useVolunteerHours()`
Hook básico para buscar todas as horas de voluntariado.

### `useCreateVolunteerHour()`
Hook para criar uma nova hora de voluntariado com:
- Mutação otimista
- Invalidação automática do cache
- Toast de sucesso/erro
- Loading state

### `useVolunteerHoursWithFilters(filters)`
Hook avançado com filtros e ordenação:
- Filtro por pessoa (nome ou email)
- Ordenação por nome ou horas
- Ordem ascendente/descendente

## Configuração Necessária

### 1. SheetDB
- Criar conta no [SheetDB](https://sheetdb.io)
- Configurar planilha do Google Sheets
- Obter URL da API

### 2. Variáveis de Ambiente
Adicionar ao `.env.local`:
```env
SHEETDB_API_URL=https://sheetdb.io/api/v1/YOUR_SHEET_ID
SHEETDB_API_KEY=your-api-key-if-required
```

### 3. Estrutura da Planilha
```
| id | name | email | date | hours | activity | description | created_at |
```

## Tecnologias Utilizadas

- **React Query** - Gerenciamento de estado e cache
- **React Hook Form** - Formulários com validação
- **Zod** - Validação de esquemas
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **Tailwind CSS** - Estilização
- **SheetDB** - Backend como planilha

## Fluxo de Uso

1. **Voluntário acessa `/checkin`**
   - Preenche o formulário
   - Submete os dados
   - Recebe confirmação

2. **Dados são salvos no SheetDB**
   - API intercepta a requisição
   - Adiciona timestamp
   - Salva na planilha

3. **Comunidade acessa `/voluntariometro`**
   - Visualiza estatísticas
   - Filtra e ordena registros
   - Acompanha ranking

## Benefícios

- **Simplicidade**: Usa planilha como banco de dados
- **Transparência**: Dados visíveis para toda a comunidade
- **Flexibilidade**: Filtros e ordenação dinâmicos
- **Responsividade**: Interface adaptada para mobile
- **Performance**: Cache inteligente com React Query
- **UX**: Feedback visual e estados de loading

## Próximos Passos Sugeridos

1. **Autenticação**: Integrar com sistema de login existente
2. **Relatórios**: Exportar dados para PDF/Excel
3. **Notificações**: Alertas para novos registros
4. **Gamificação**: Badges e conquistas
5. **Integração**: Conectar com outras funcionalidades da plataforma 