# Sistema de Avaliação de Mentorias

## 🎯 Filosofia

O sistema de avaliação foi projetado com foco em **simplicidade e propósito claro**:

- **Apenas mentees avaliam mentores**
- Avaliações servem para ajudar outros mentees a escolherem mentores
- Mentores recebem feedback construtivo para melhorar

## 👥 Quem Avalia Quem?

### ✅ Mentee → Mentor

- **Quando**: Após a sessão de mentoria (quando o horário já passou)
- **O que avalia**:
  - Rating de 1 a 5 estrelas
  - Feedback público (aparece no perfil do mentor)
  - Notas privadas (apenas para o mentee)

### ❌ Mentor → Mentee

- **Não há avaliação formal**
- Mentor pode registrar observações via `notes_mentor` ao confirmar
- Feedback ao mentee pode ser dado durante a sessão ou por outros meios

## 📊 Componentes do Sistema

### 1. Rating (Obrigatório)

- Escala de 1 a 5 estrelas
- Aparece no perfil do mentor
- Usado para calcular média de avaliações

### 2. Feedback Público (Opcional)

- Texto livre descrevendo a experiência
- **Visível publicamente** no perfil do mentor
- Ajuda outros mentees a decidirem
- Exemplos:
  - "Excelente mentoria! Aprendi muito sobre..."
  - "O mentor foi muito atencioso e preparado..."

### 3. Notas Privadas (Opcional)

- Anotações pessoais do mentee
- **Apenas o mentee vê**
- Útil para:
  - Registrar aprendizados
  - Pontos para próxima sessão
  - Reflexões pessoais

## 🔄 Fluxo de Avaliação

```
1. Sessão acontece (horário passa)
   ↓
2. Mentee vê botão "Avaliar" no card
   ↓
3. Mentee preenche avaliação
   ↓
4. Appointment muda para status "completed"
   ↓
5. Avaliação aparece no perfil do mentor
```

## 💾 Estrutura de Dados

### Tabela: `appointment_feedbacks`

```sql
- id: uuid
- appointment_id: bigint (FK)
- reviewer_id: uuid (sempre o mentee)
- reviewed_id: uuid (sempre o mentor)
- rating: integer (1-5)
- public_feedback: text (opcional)
- private_notes: text (opcional)
- created_at: timestamp
```

### Tabela: `appointments`

```sql
- status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
- notes_mentee: text (comentários ao solicitar)
- notes_mentor: text (observações ao confirmar)
```

## 🎨 Interface do Usuário

### Card de Appointment (Mentee)

```
┌─────────────────────────────────────┐
│ 👤 Maria Santos (Mentor)            │
│ 📅 Hoje • 14:00 (45 min)           │
│ ✅ Confirmado                       │
│                                     │
│ [💬 Chat]  [✅ Avaliar] [🎥 Meet]  │
└─────────────────────────────────────┘
```

### Card de Appointment (Mentor)

```
┌─────────────────────────────────────┐
│ 👤 João Silva (Mentee)              │
│ 📅 Hoje • 14:00 (45 min)           │
│ ✅ Confirmado                       │
│                                     │
│ [💬 Chat]  [🎥 Meet]                │
└─────────────────────────────────────┘
```

_Nota: Mentor não vê botão "Avaliar"_

## 🚀 Benefícios desta Abordagem

### ✅ Vantagens

1. **Simplicidade**: Não precisa controlar "quem avalia primeiro"
2. **Foco claro**: Avaliações servem para escolher mentores
3. **Menos complexidade**: Um fluxo único e direto
4. **Propósito definido**: Mentores constroem reputação

### 🔮 Futuras Expansões (Opcional)

Se necessário no futuro, podemos adicionar:

1. **Feedback do Mentor ao Mentee**

   - Sistema separado de "Recomendações"
   - Mentor pode escrever carta de recomendação
   - Aparece no perfil do mentee

2. **Avaliação Mútua**

   - Ambos avaliam a sessão
   - Ratings separados
   - Feedbacks cruzados

3. **Badges e Conquistas**
   - Mentor recebe badges por avaliações
   - "Top Mentor do Mês"
   - "100 Mentorias Realizadas"

## 📈 Métricas Importantes

### Para Mentores

- Média de rating (1-5 estrelas)
- Número total de avaliações
- Feedbacks públicos recentes
- Taxa de conclusão de mentorias

### Para Mentees

- Número de mentorias realizadas
- Mentores com quem já teve sessão
- Histórico de aprendizados (notas privadas)

## 🔒 Privacidade

- ✅ **Público**: Rating, feedback público, nome do avaliador
- 🔒 **Privado**: Notas privadas do mentee
- 🔒 **Privado**: Observações do mentor (`notes_mentor`)

## 💡 Boas Práticas

### Para Mentees ao Avaliar

- Seja honesto mas construtivo
- Destaque pontos positivos
- Sugira melhorias de forma respeitosa
- Lembre-se: sua avaliação é pública

### Para Mentores

- Use `notes_mentor` para registrar observações
- Dê feedback verbal durante a sessão
- Seja receptivo a críticas construtivas
- Use avaliações para melhorar continuamente
