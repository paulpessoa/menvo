# Sistema de Consentimento de Cookies - MENVO

## Arquivos Principais

1. **`components/cookie-consent-banner.tsx`** - Banner de cookies
2. **`app/layout.tsx`** - Inicialização do Clarity

---

## Como Funciona

### 1. Armazenamento (localStorage)

```javascript
// Chave que guarda as preferências do usuário
"cookie-consent" → {"necessary":true,"analytics":true,"functional":false}

// Chave que guarda a data do consentimento
"cookie-consent-date" → "2025-11-25T10:30:00.000Z"
```

### 2. Interface de Preferências

```typescript
interface CookiePreferences {
  necessary: boolean; // Sempre true
  analytics: boolean; // Microsoft Clarity (true = ativado)
  functional: boolean; // Futuro
}
```

---

## Fluxo Principal

### Primeira Visita (sem consentimento)

```
1. Usuário acessa o site
2. Clarity carrega com consent=false (desativado)
3. Banner aparece após 1 segundo
4. Usuário escolhe uma opção
5. Preferências salvas no localStorage
6. Clarity recebe sinal: clarity('consent', true/false)
```

### Visitas Seguintes (com consentimento)

```
1. Usuário acessa o site
2. Sistema lê localStorage
3. Aplica preferências salvas
4. Clarity recebe sinal automaticamente
5. Banner NÃO aparece
```

---

## Funções Importantes

### `applyClarityConsent(analyticsConsent: boolean)`

Envia sinal de consentimento para o Microsoft Clarity.

```typescript
const applyClarityConsent = (analyticsConsent: boolean) => {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("consent", analyticsConsent);
  }
};
```

### `savePreferences(prefs: CookiePreferences)`

Salva preferências e aplica consentimento.

```typescript
const savePreferences = (prefs: CookiePreferences) => {
  localStorage.setItem("cookie-consent", JSON.stringify(prefs));
  localStorage.setItem("cookie-consent-date", new Date().toISOString());
  applyClarityConsent(prefs.analytics);
  setShowBanner(false);
};
```

### `acceptAll()`

Aceita todos os cookies (Clarity ativado).

```typescript
const acceptAll = () => {
  savePreferences({
    necessary: true,
    analytics: true, // ✅ Clarity ON
    functional: true,
  });
};
```

### `acceptNecessary()`

Aceita apenas cookies necessários (Clarity desativado).

```typescript
const acceptNecessary = () => {
  savePreferences({
    necessary: true,
    analytics: false, // ❌ Clarity OFF
    functional: false,
  });
};
```

---

## Inicialização do Clarity (layout.tsx)

```javascript
// Script carrega e verifica localStorage
var consent = localStorage.getItem("cookie-consent");

if (consent) {
  var prefs = JSON.parse(consent);
  clarity("consent", prefs.analytics || false);
} else {
  clarity("consent", false); // Padrão: desativado
}
```

**ID do Projeto:** `rz28fusa38`

---

## Como Testar

### Resetar Consentimento

```javascript
// No console do navegador (F12)
localStorage.removeItem("cookie-consent");
localStorage.removeItem("cookie-consent-date");
location.reload();
```

### Verificar Consentimento Atual

```javascript
// Ver preferências salvas
localStorage.getItem("cookie-consent");

// Ver logs do Clarity
// Console mostra: "[Clarity] Consent signal sent: true/false"
```

### Testar Fluxos

1. **Aceitar Todos:** Clarity deve ativar
2. **Apenas Necessários:** Clarity deve desativar
3. **Personalizar:** Escolher analytics ON/OFF
4. **Recarregar página:** Banner não deve aparecer novamente

---

## Variáveis Chave

| Variável         | Onde         | O que faz                     |
| ---------------- | ------------ | ----------------------------- |
| `cookie-consent` | localStorage | Guarda preferências           |
| `showBanner`     | State        | Mostra/esconde banner         |
| `preferences`    | State        | Estado atual das preferências |
| `window.clarity` | Global       | API do Clarity                |

---

## Pontos Importantes

1. **Clarity desativado por padrão** até usuário consentir
2. **Banner aparece 1 segundo** após carregar a página
3. **Preferências persistem** entre sessões
4. **Sempre usa try/catch** para segurança
5. **Fallback seguro:** Em caso de erro, Clarity fica desativado

---

---

## O que é `window.clarity`?

É uma **função JavaScript global** criada pelo script do Microsoft Clarity quando carrega no navegador.

### Como funciona:

```javascript
// 1. Script do Clarity carrega e cria a função
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){...};  // ← Cria window.clarity
})(window, document, "clarity", "script", "rz28fusa38");

// 2. Depois você pode chamar:
window.clarity('consent', true)   // ✅ Pode trackear
window.clarity('consent', false)  // ❌ Não pode trackear
```

### Comandos Disponíveis:

| Comando    | Exemplo                                  | O que faz                   |
| ---------- | ---------------------------------------- | --------------------------- |
| `consent`  | `clarity('consent', true)`               | Liga/desliga tracking       |
| `event`    | `clarity('event', 'clicou_mentor')`      | Registra evento customizado |
| `identify` | `clarity('identify', 'user-123', {...})` | Identifica usuário          |
| `set`      | `clarity('set', 'plano', 'premium')`     | Adiciona metadados          |

---

## Eventos Personalizados (Custom Events)

Você pode usar a mesma função `window.clarity()` para registrar eventos customizados:

```javascript
// Exemplo: Registrar quando usuário agenda mentoria
const handleAgendarMentoria = () => {
  if (window.clarity) {
    window.clarity("event", "agendou_mentoria");
  }
  agendarMentoria();
};

// Exemplo: Registrar quando clica em um mentor
const handleClickMentor = (mentorId) => {
  if (window.clarity) {
    window.clarity("event", "clicou_mentor");
    window.clarity("set", "mentor_id", mentorId);
  }
  router.push(`/mentors/${mentorId}`);
};

// Exemplo: Identificar usuário após login
const handleLogin = (user) => {
  if (window.clarity) {
    window.clarity("identify", user.id, {
      email: user.email,
      tipo: user.is_mentor ? "mentor" : "mentee",
    });
  }
};
```

### Fluxo Completo:

```
1. Usuário aceita cookies
   → clarity('consent', true) ✅

2. Clarity começa a trackear automaticamente
   → Gravações de sessão, mapas de calor

3. Você pode registrar eventos customizados
   → clarity('event', 'nome_do_evento')
   → Aparece no dashboard do Clarity
```

---

## Conformidade

✅ GDPR, LGPD, CCPA  
✅ Microsoft Clarity Requirements (prazo: 31/10/2025)  
✅ Consentimento explícito obrigatório  
✅ Opt-in (não opt-out)
