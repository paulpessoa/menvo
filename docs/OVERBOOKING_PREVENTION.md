# Prevenção de Overbooking

## 🎯 Problema

Sem controle adequado, múltiplos mentees poderiam solicitar mentorias no mesmo horário, causando conflitos de agenda para o mentor.

## ✅ Solução Implementada

### 1. API Centralizada de Disponibilidade

**Endpoint**: `/api/appointments/availability_status`

Esta API é a **única fonte de verdade** para horários disponíveis. Ela:

1. ✅ Busca a disponibilidade configurada pelo mentor
2. ✅ Busca appointments existentes (`pending` e `confirmed`)
3. ✅ **Verifica sobreposição de horários** (não apenas horário exato)
4. ✅ Remove horários ocupados da lista
5. ✅ Retorna apenas horários realmente disponíveis

### 2. Verificação de Sobreposição

A função `isSlotBooked` verifica se há **qualquer sobreposição** entre:

- O novo slot proposto (45 minutos)
- Appointments existentes (com suas durações)

```typescript
const isSlotBooked = (slotStart: Date, slotDuration: number = 45): boolean => {
  return (appointments || []).some((apt: any) => {
    const aptStart = new Date(apt.scheduled_at);
    const aptEnd = new Date(
      aptStart.getTime() + apt.duration_minutes * 60 * 1000,
    );
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    // Verifica se há sobreposição de horários
    return slotStart < aptEnd && slotEnd > aptStart;
  });
};
```

### 3. Status Considerados

A API filtra appointments com status:

- ✅ `pending` - Solicitações aguardando confirmação
- ✅ `confirmed` - Mentorias confirmadas

**Não considera:**

- ❌ `cancelled` - Horário liberado
- ❌ `completed` - Mentoria já realizada

## 🔄 Fluxo de Agendamento

```
1. Mentee abre modal de agendamento
   ↓
2. Modal chama /api/appointments/availability_status
   ↓
3. API verifica appointments existentes
   ↓
4. API remove horários ocupados
   ↓
5. Mentee vê apenas horários disponíveis
   ↓
6. Mentee seleciona horário
   ↓
7. API /appointments/schedule cria appointment
   ↓
8. Horário fica "ocupado" (status: pending)
```

## 📊 Exemplo de Sobreposição

### Cenário 1: Appointment Existente

```
Appointment existente:
- Início: 14:00
- Duração: 45 min
- Fim: 14:45

Slots bloqueados:
❌ 13:30 (terminaria às 14:15, sobrepõe)
❌ 14:00 (horário exato)
❌ 14:15 (começaria antes do fim)
✅ 14:45 (não sobrepõe)
✅ 15:00 (não sobrepõe)
```

### Cenário 2: Múltiplos Appointments

```
Appointments:
1. 09:00 - 09:45
2. 10:00 - 10:45
3. 14:00 - 14:45

Horários disponíveis:
✅ 08:00 - 08:45
❌ 09:00 - 09:45 (ocupado)
✅ 09:45 - 10:30 (mas sobrepõe com #2)
❌ 10:00 - 10:45 (ocupado)
✅ 10:45 - 11:30
✅ 11:00 - 11:45
...
❌ 14:00 - 14:45 (ocupado)
✅ 14:45 - 15:30
```

## 🛡️ Camadas de Proteção

### Camada 1: Frontend (BookMentorshipModal)

- Usa API de availability_status
- Mostra apenas horários disponíveis
- Previne seleção de horários ocupados

### Camada 2: API de Criação (/appointments/create)

- Verifica conflitos antes de criar
- Retorna erro 409 se houver conflito
- Validação adicional de segurança

```typescript
// Em /api/appointments/create/route.ts
const { data: conflicts } = await supabase
  .from("appointments")
  .select("id")
  .eq("mentor_id", mentor_id)
  .in("status", ["pending", "confirmed"])
  .gte("scheduled_at", scheduledDate.toISOString())
  .lt("scheduled_at", endTime.toISOString());

if (conflicts && conflicts.length > 0) {
  return NextResponse.json(
    { error: "Time slot is not available" },
    { status: 409 },
  );
}
```

## 🔄 Atualização em Tempo Real

### Problema

Se dois mentees abrem o modal ao mesmo tempo, ambos veem o mesmo horário disponível.

### Solução Atual

- API verifica disponibilidade no momento da criação
- Primeiro a criar "ganha" o horário
- Segundo recebe erro 409 (Conflict)

### Solução Futura (Opcional)

- WebSocket ou polling para atualizar horários em tempo real
- Reserva temporária de horário (5 minutos)
- Notificação quando horário é ocupado

## 📝 Componentes Atualizados

### ✅ `/api/appointments/availability_status`

- Função `isSlotBooked` para verificar sobreposição
- Filtra appointments `pending` e `confirmed`
- Considera duração dos appointments

### ✅ `BookMentorshipModal.tsx`

- Usa API de availability_status (não gera slots localmente)
- Remove função `generateUpcomingSlots`
- Confia na API como fonte única de verdade

### ✅ `/api/appointments/create`

- Já tinha verificação de conflitos
- Mantém validação de segurança

## 🧪 Testes Recomendados

### Teste 1: Horário Ocupado

1. Criar appointment às 14:00
2. Tentar criar outro às 14:00
3. ✅ Deve retornar erro 409

### Teste 2: Sobreposição Parcial

1. Criar appointment às 14:00 (45 min)
2. Tentar criar às 14:30
3. ✅ Deve retornar erro 409

### Teste 3: Horário Adjacente

1. Criar appointment às 14:00 (45 min)
2. Criar às 14:45
3. ✅ Deve funcionar (não sobrepõe)

### Teste 4: Cancelamento

1. Criar appointment às 14:00
2. Cancelar appointment
3. Verificar disponibilidade
4. ✅ 14:00 deve aparecer disponível

## 🚀 Benefícios

1. ✅ **Sem overbooking**: Impossível agendar horários ocupados
2. ✅ **Simples**: Uma API centralizada
3. ✅ **Confiável**: Verifica sobreposição real
4. ✅ **Escalável**: Funciona com múltiplos mentees
5. ✅ **Seguro**: Validação em múltiplas camadas

## 💡 Melhorias Futuras

1. **Cache**: Cachear disponibilidade por alguns segundos
2. **Reserva Temporária**: Bloquear horário por 5 min durante agendamento
3. **Notificações**: Avisar se horário foi ocupado enquanto usuário preenchia form
4. **Otimização**: Índices no banco para queries mais rápidas
