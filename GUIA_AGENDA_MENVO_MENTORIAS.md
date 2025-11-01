# 📅 Guia: Criar Agenda "Menvo Mentorias"

## 🎯 Por que criar uma agenda separada?

### Vantagens:
- ✅ **Organização:** Separa eventos de mentoria dos pessoais
- ✅ **Profissional:** Agenda dedicada para a plataforma
- ✅ **Compartilhamento:** Pode compartilhar só essa agenda com a equipe
- ✅ **Análise:** Facilita ver estatísticas de mentorias
- ✅ **Limpeza:** Pode deletar/limpar sem afetar agenda pessoal

---

## 📋 Opção 1: Criar Manualmente (Recomendado)

### Passo a Passo:

1. **Acesse Google Calendar**
   ```
   https://calendar.google.com
   ```

2. **Criar Nova Agenda**
   - No lado esquerdo, procure "Outras agendas"
   - Clique no **"+"** ao lado
   - Selecione **"Criar nova agenda"**

3. **Preencher Informações**
   ```
   Nome: Menvo Mentorias
   Descrição: Agenda para eventos de mentoria da plataforma Menvo
   Fuso horário: (GMT-03:00) Horário de Brasília
   ```

4. **Criar Agenda**
   - Clique em **"Criar agenda"**
   - Aguarde alguns segundos

5. **Copiar ID da Agenda**
   - Na lista de agendas, clique em **"Menvo Mentorias"**
   - Clique em **"Configurações e compartilhamento"**
   - Role até **"Integrar agenda"**
   - Copie o **ID da agenda**
   
   Exemplo: `abc123def456@group.calendar.google.com`

6. **Adicionar no .env.local**
   ```env
   GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com
   ```

7. **Reiniciar o servidor**
   ```bash
   # Parar o servidor (Ctrl+C)
   npm run dev
   ```

---

## 📋 Opção 2: Criar via Script

### Passo a Passo:

1. **Executar o script**
   ```bash
   node scripts/create-menvo-calendar.js
   ```

2. **Copiar o ID gerado**
   ```
   ✅ Agenda criada com sucesso!
   📋 ID da agenda: abc123def456@group.calendar.google.com
   
   🔧 Adicione no seu .env.local:
   GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com
   ```

3. **Adicionar no .env.local**
   ```env
   GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com
   ```

4. **Reiniciar o servidor**
   ```bash
   npm run dev
   ```

---

## ✅ Verificar se Funcionou

### Teste 1: Verificar no Google Calendar
```
1. Acesse https://calendar.google.com
2. Procure "Menvo Mentorias" na lista de agendas
3. Deve estar visível e marcada
```

### Teste 2: Criar um evento de teste
```
1. Confirme uma mentoria na plataforma
2. Verifique se o evento aparece em "Menvo Mentorias"
3. Não deve aparecer na agenda principal
```

### Teste 3: Verificar convites
```
1. Mentor e mentorado devem receber convites
2. Ao aceitar, evento vai para agenda deles
3. Mas o evento "mestre" fica em "Menvo Mentorias"
```

---

## 🔧 Configuração Completa

### Variáveis no .env.local:

```env
# Google Calendar - Credenciais
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret
GOOGLE_CALENDAR_REFRESH_TOKEN=seu_refresh_token

# Google Calendar - Agenda Específica (NOVO)
GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com
```

### Se não adicionar GOOGLE_CALENDAR_ID:
- ✅ Funciona normalmente
- ✅ Usa agenda `primary` (principal)
- ⚠️ Eventos ficam misturados com pessoais

### Se adicionar GOOGLE_CALENDAR_ID:
- ✅ Usa agenda "Menvo Mentorias"
- ✅ Eventos separados e organizados
- ✅ Mais profissional

---

## 🎨 Personalizar a Agenda

### Mudar Cor:
```
1. Google Calendar → Menvo Mentorias
2. Clique nos 3 pontinhos
3. Escolha uma cor (ex: Verde para mentorias)
```

### Compartilhar com Equipe:
```
1. Configurações → Menvo Mentorias
2. "Compartilhar com pessoas específicas"
3. Adicionar emails da equipe
4. Permissão: "Ver todos os detalhes do evento"
```

### Tornar Pública (opcional):
```
1. Configurações → Menvo Mentorias
2. "Permissões de acesso"
3. Marcar "Disponibilizar publicamente"
4. Escolher "Ver todos os detalhes do evento"
```

---

## 📊 Comparação

| Aspecto | Agenda Primary | Agenda Menvo Mentorias |
|---------|----------------|------------------------|
| Organização | 🟡 Misturado | 🟢 Separado |
| Profissional | 🟡 Pessoal | 🟢 Profissional |
| Compartilhamento | ❌ Difícil | ✅ Fácil |
| Análise | ❌ Difícil | ✅ Fácil |
| Limpeza | ❌ Arriscado | ✅ Seguro |

---

## 🔄 Migrar Eventos Existentes (Opcional)

Se você já tem eventos na agenda principal e quer mover:

### Manualmente:
```
1. Abra o evento no Google Calendar
2. Clique em "Mais ações"
3. Selecione "Mover para..."
4. Escolha "Menvo Mentorias"
```

### Via Script (para muitos eventos):
```javascript
// Criar script se necessário
// Buscar eventos com "Mentoria:" no título
// Mover para nova agenda
```

---

## ⚠️ Importante

### Permissões:
- ✅ Você precisa ser **proprietário** da conta Google
- ✅ Ou ter permissão para criar agendas
- ✅ O refresh token precisa ter escopo `calendar`

### Backup:
- ✅ Eventos ficam no Google Calendar
- ✅ Não são perdidos se deletar a agenda
- ✅ Podem ser exportados (.ics)

### Sincronização:
- ✅ Funciona em todos os dispositivos
- ✅ Apps de calendário sincronizam automaticamente
- ✅ Convites funcionam normalmente

---

## 🆘 Problemas Comuns

### Erro: "Calendar not found"
```
Solução:
1. Verifique se o ID está correto
2. Verifique se a agenda existe
3. Verifique se tem permissão
```

### Eventos não aparecem na nova agenda
```
Solução:
1. Verifique se GOOGLE_CALENDAR_ID está no .env.local
2. Reinicie o servidor
3. Teste criar novo evento
```

### Convites não são enviados
```
Solução:
1. Verifique se agenda tem permissão de enviar convites
2. Configurações → Menvo Mentorias → Permissões
3. Marcar "Fazer alterações em eventos"
```

---

## ✅ Checklist Final

- [ ] Agenda "Menvo Mentorias" criada
- [ ] ID da agenda copiado
- [ ] GOOGLE_CALENDAR_ID adicionado no .env.local
- [ ] Servidor reiniciado
- [ ] Evento de teste criado
- [ ] Evento aparece na agenda correta
- [ ] Convites enviados e recebidos
- [ ] Cor personalizada (opcional)
- [ ] Compartilhada com equipe (opcional)

---

## 🎉 Resultado Final

Agora você tem:
- ✅ Agenda dedicada "Menvo Mentorias"
- ✅ Eventos organizados e separados
- ✅ Mais profissional
- ✅ Fácil de compartilhar e analisar
- ✅ Convites funcionando perfeitamente

**Sua plataforma está ainda mais profissional!** 🚀

---

**Última atualização:** 2025-01-30
**Status:** ✅ Implementado e documentado
