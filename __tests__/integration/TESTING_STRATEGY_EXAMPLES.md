# Estratégia de Testes - Exemplos Práticos

## 🎯 Comparação: Unitário vs Integração vs E2E

Vamos usar o **fluxo de login** como exemplo para mostrar a diferença entre os tipos de teste:

### 🧪 Teste Unitário - `useAuth` Hook

\`\`\`javascript
// __tests__/lib/auth/use-auth.test.ts
describe('useAuth hook', () => {
  it('should handle sign in', async () => {
    // FOCO: Apenas o hook, tudo mockado
    const mockSignIn = jest.fn().mockResolvedValue({ user: mockUser })
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider mockSignIn={mockSignIn}>
          {children}
        </AuthProvider>
      )
    })

    await act(async () => {
      await result.current.signIn('test@example.com', 'password')
    })

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password')
    expect(result.current.user).toEqual(mockUser)
  })
})
\`\`\`

**Características:**
- ✅ Rápido (milissegundos)
- ✅ Isolado (apenas o hook)
- ✅ Determinístico
- ❌ Não testa integração real

### 🔗 Teste de Integração - Fluxo Completo

\`\`\`javascript
// __tests__/integration/auth-integration.test.ts
describe('Login Integration', () => {
  it('should complete login flow with API integration', async () => {
    // FOCO: Múltiplos componentes + API, mocks parciais
    
    // Mock apenas a API externa, não a lógica interna
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          profile: { id: '123', full_name: 'Test User' },
          role: 'mentor'
        })
      })

    const user = userEvent.setup()
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    )

    // Testa o fluxo real: form → API → context → redirect
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Valida que toda a cadeia funcionou
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument()
    })
  })
})
\`\`\`

**Características:**
- ✅ Testa integração real entre componentes
- ✅ Valida contratos de API
- ✅ Ainda rápido (segundos)
- ❌ Não testa UI real no navegador

### 🌐 Teste E2E - Jornada Completa

\`\`\`javascript
// e2e/auth.spec.ts (Playwright)
test('User can complete full signup and booking journey', async ({ page }) => {
  // FOCO: Usuário real, navegador real, sistemas reais
  
  // Vai para a página real
  await page.goto('http://localhost:3000/signup')
  
  // Preenche formulário real
  await page.fill('[data-testid="first-name"]', 'João')
  await page.fill('[data-testid="last-name"]', 'Silva')
  await page.fill('[data-testid="email"]', 'joao@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  
  // Clica no botão real
  await page.click('button[type="submit"]')
  
  // Espera redirecionamento real
  await page.waitForURL('**/confirm-email')
  await expect(page.locator('text=Confirme seu email')).toBeVisible()
  
  // Simula clique no email (ou usa API de teste)
  await page.goto('http://localhost:3000/auth/callback?token=test-token')
  
  // Seleciona role
  await page.waitForURL('**/select-role')
  await page.click('[data-testid="mentor-option"]')
  await page.click('button:has-text("Confirmar")')
  
  // Verifica dashboard
  await page.waitForURL('**/dashboard/mentor')
  await expect(page.locator('text=Dashboard do Mentor')).toBeVisible()
  
  // Continua para booking...
  await page.click('text=Meus Agendamentos')
  await expect(page.locator('[data-testid="appointments-list"]')).toBeVisible()
})
\`\`\`

**Características:**
- ✅ Testa experiência real do usuário
- ✅ Valida UI, UX, performance
- ✅ Detecta problemas de integração real
- ❌ Lento (minutos)
- ❌ Pode ser flaky
- ❌ Difícil de debuggar

## 📊 Quando Usar Cada Um

### 🧪 Use Testes Unitários Para:
\`\`\`javascript
// ✅ Validação de dados
function validateEmail(email: string): boolean
function formatCurrency(amount: number): string
function calculateDuration(start: Date, end: Date): number

// ✅ Lógica de negócio pura
function canUserBookAppointment(user: User, mentor: Mentor): boolean
function calculateMentorRating(feedbacks: Feedback[]): number

// ✅ Hooks isolados
function useLocalStorage(key: string)
function useDebounce(value: string, delay: number)
\`\`\`

### 🔗 Use Testes de Integração Para:
\`\`\`javascript
// ✅ Fluxos de autenticação
"signup → confirmation → role selection → dashboard"

// ✅ Processos de negócio
"mentor verification → public listing → booking availability"

// ✅ Integrações de API
"appointment creation → Google Calendar → email notification"

// ✅ Validação de contratos
"API endpoints structure and error handling"
\`\`\`

### 🌐 Use Testes E2E Para:
\`\`\`javascript
// ✅ Jornadas críticas do usuário
"New user signs up and books first appointment"

// ✅ Fluxos de pagamento
"User selects plan → payment → access granted"

// ✅ Funcionalidades cross-browser
"OAuth login works in Chrome, Firefox, Safari"

// ✅ Performance crítica
"Page loads under 3 seconds on mobile"
\`\`\`

## 🎯 Estratégia Para Este Projeto

### Implementado ✅
- **Testes de Integração**: Validam todos os fluxos críticos de auth
- **Cobertura**: 13 testes cobrindo signup, login, verification, booking

### Próximos Passos 🚀

#### 1. Completar Testes Unitários
\`\`\`bash
# Adicionar testes para:
__tests__/lib/utils/validation.test.ts
__tests__/lib/hooks/useLocalStorage.test.ts
__tests__/components/ui/Button.test.tsx
\`\`\`

#### 2. Implementar Testes E2E Críticos
\`\`\`bash
# Instalar Playwright
npm install @playwright/test

# Criar testes para:
e2e/critical-user-journeys.spec.ts
e2e/payment-flow.spec.ts
e2e/mentor-onboarding.spec.ts
\`\`\`

#### 3. Configurar CI/CD Pipeline
\`\`\`yaml
# .github/workflows/test.yml
- name: Unit Tests
  run: npm test -- --testPathIgnorePatterns=integration,e2e
  
- name: Integration Tests  
  run: npm test -- --testPathPattern=integration
  
- name: E2E Tests
  run: npx playwright test
  if: github.event_name == 'pull_request'
\`\`\`

## 📈 Métricas de Qualidade

### Cobertura Recomendada:
- **Unitários**: 80%+ das funções/hooks
- **Integração**: 100% dos fluxos críticos
- **E2E**: 100% das jornadas de usuário críticas

### Performance:
- **Unitários**: < 10 segundos total
- **Integração**: < 30 segundos total  
- **E2E**: < 5 minutos total

### Confiabilidade:
- **Unitários**: 0% flaky
- **Integração**: < 1% flaky
- **E2E**: < 5% flaky
