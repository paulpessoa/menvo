# 🔧 Guia Rápido de Correção

## Problema 1: Erro na API `/api/organizations`

### Causa

A variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` não está configurada.

### Solução

1. **Obter a Service Role Key do Supabase:**

   - Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Copie a **service_role key** (não a anon key!)

2. **Adicionar no arquivo `.env.local`:**

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Reiniciar o servidor:**
   ```bash
   # Parar o servidor (Ctrl+C)
   npm run dev
   ```

### ⚠️ IMPORTANTE

- **NUNCA** commite a service role key no git
- Ela já está no `.gitignore` via `.env.local`
- Use apenas em variáveis de ambiente do servidor

---

## Problema 2: Quem Pode Criar Organizações?

### Situação Atual

✅ **Qualquer usuário autenticado** pode criar uma organização

### Isso é Correto?

**Depende da sua estratégia de negócio:**

#### Opção A: Qualquer Usuário (Atual - Recomendado para MVP)

**Prós:**

- Facilita onboarding de organizações
- Permite crescimento orgânico
- Menos fricção para novos clientes

**Contras:**

- Pode gerar spam de organizações
- Requer aprovação manual de cada uma

**Fluxo:**

1. Usuário cria organização
2. Status: "pending_approval"
3. Admin aprova manualmente
4. Organização fica ativa

#### Opção B: Apenas Admins ou Usuários Verificados

**Prós:**

- Mais controle sobre quem cria
- Menos spam
- Organizações mais sérias

**Contras:**

- Mais fricção no onboarding
- Pode perder clientes potenciais

---

## Recomendação: Manter Como Está + Melhorias

### Manter:

✅ Qualquer usuário autenticado pode criar
✅ Requer aprovação do admin

### Adicionar (Opcional):

1. **Rate Limiting** - Limitar criações por usuário
2. **Email Verification** - Só usuários com email verificado
3. **Captcha** - Prevenir bots
4. **Quota** - Máximo de organizações por usuário

---

## Implementação de Melhorias (Opcional)

### 1. Apenas Usuários Verificados

```typescript
// app/api/organizations/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // ADICIONAR: Verificar se email está verificado
    if (!user.email_confirmed_at) {
      return errorResponse(
        "Email verification required to create organizations",
        "EMAIL_NOT_VERIFIED",
        403
      )
    }

    // Resto do código...
  }
}
```

### 2. Limitar Organizações por Usuário

```typescript
// app/api/organizations/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... auth code ...

    // ADICIONAR: Verificar quantas organizações o usuário já criou
    const { count } = await serviceSupabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "admin")

    if (count && count >= 3) { // Máximo 3 organizações por usuário
      return errorResponse(
        "Maximum number of organizations reached (3)",
        "QUOTA_EXCEEDED",
        429
      )
    }

    // Resto do código...
  }
}
```

### 3. Adicionar na Página de Criação

```typescript
// app/organizations/new/page.tsx
const checkAuth = async () => {
  try {
    const response = await fetch("/api/auth/session");
    if (response.ok) {
      const data = await response.json();

      // Verificar se email está verificado
      if (!data.user?.email_confirmed_at) {
        setError(
          "Você precisa verificar seu email antes de criar uma organização"
        );
        return;
      }

      setIsAuthenticated(true);
    } else {
      router.push("/auth/login?redirect=/organizations/new");
    }
  } catch (err) {
    router.push("/auth/login?redirect=/organizations/new");
  } finally {
    setLoading(false);
  }
};
```

---

## Decisão Recomendada

### Para MVP/Lançamento Inicial:

✅ **Manter como está** - Qualquer usuário autenticado pode criar
✅ Aprovação manual do admin funciona como filtro
✅ Monitorar por algumas semanas

### Depois de Validar:

- Se houver spam → Adicionar verificação de email
- Se houver abuso → Adicionar rate limiting
- Se houver muitas organizações fake → Adicionar captcha

---

## Checklist de Configuração

- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] Reiniciar servidor de desenvolvimento
- [ ] Testar criação de organização
- [ ] Testar listagem de organizações
- [ ] Decidir sobre restrições adicionais
- [ ] Monitorar criações nas primeiras semanas

---

## Testando Após Configuração

```bash
# 1. Parar o servidor
Ctrl+C

# 2. Verificar se .env.local tem a key
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# 3. Reiniciar
npm run dev

# 4. Testar no browser
# - Ir para /organizations
# - Deve listar organizações (vazio no início)
# - Ir para /organizations/new
# - Criar uma organização de teste
```

---

## Próximos Passos

1. ✅ Configurar `SUPABASE_SERVICE_ROLE_KEY`
2. ✅ Testar criação de organização
3. ✅ Testar aprovação como admin
4. ⏳ Decidir sobre restrições adicionais
5. ⏳ Monitorar uso real

**Qualquer dúvida, me chame!** 🚀
