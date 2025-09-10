# Integration Tests for Auth Refactor

This directory contains comprehensive integration tests for the auth refactor implementation, validating all the requirements specified in task 12.2.

## Test Coverage

### 1. Complete Authentication Flow (Requirements 4.5, 5.5, 6.5)

#### Signup → Confirmation → Role Selection → Dashboard Flow
- **Signup Process**: Validates user registration with email/password and OAuth providers
- **Email Confirmation**: Tests email verification callback handling
- **Role Selection**: Validates mandatory role selection (mentor/mentee) after confirmation
- **Dashboard Redirect**: Ensures proper redirection based on selected role

#### OAuth Provider Integration
- **Google OAuth**: Tests Google authentication flow with proper provider mapping
- **LinkedIn OAuth**: Tests LinkedIn authentication with `linkedin_oidc` provider
- **Callback Handling**: Validates OAuth callback processing and redirection

#### Error Handling
- **Email Not Confirmed**: Tests handling of unconfirmed email login attempts
- **Invalid Credentials**: Validates error messages for wrong email/password
- **Token Expiration**: Tests expired token handling and re-authentication flows

### 2. Mentor Verification Flow (Requirements 9.5)

#### Admin Dashboard Functionality
- **Unverified Mentor Listing**: Tests display of mentors pending verification
- **Verification Actions**: Validates admin ability to verify/reject mentors
- **Access Control**: Ensures only admins can access verification features

#### Verification Process
- **API Integration**: Tests `/api/mentors/verify` endpoint functionality
- **Status Updates**: Validates mentor profile updates after verification
- **Public Listing**: Tests verified mentor appearance in public mentor list

#### Error Scenarios
- **Authorization Errors**: Tests non-admin access rejection
- **Invalid Mentor IDs**: Validates error handling for non-existent mentors
- **Network Failures**: Tests graceful degradation on API failures

### 3. Appointment and Google Calendar Integration (Requirements 11.5)

#### Appointment Booking Flow
- **Availability Display**: Tests mentor availability presentation
- **Booking Form**: Validates appointment booking form functionality
- **Conflict Detection**: Tests time slot conflict resolution
- **Confirmation Process**: Validates appointment confirmation workflow

#### Google Calendar Integration
- **Event Creation**: Tests automatic Google Calendar event creation
- **Meet Link Generation**: Validates Google Meet link inclusion
- **Attendee Management**: Tests proper attendee addition to calendar events
- **Event Details**: Validates event title, description, and timing

#### Validation and Error Handling
- **Input Validation**: Tests required field validation
- **Future Date Requirement**: Validates scheduling only future appointments
- **Mentor Verification**: Ensures only verified mentors can receive bookings
- **Conflict Resolution**: Tests handling of double-booked time slots

## Test Files

### `auth-integration.test.ts`
Core integration tests focusing on API endpoints, error handling, and business logic validation without complex component mocking.

**Key Test Areas:**
- API endpoint structure validation
- Error response handling
- Authentication flow patterns
- Database schema requirements
- Google Calendar integration
- Security validation

### `auth-flow.integration.test.tsx`
Component-level integration tests for the complete user authentication journey.

**Key Test Areas:**
- Signup form integration
- Email confirmation simulation
- Role selection component
- Dashboard redirection
- OAuth provider buttons

### `mentor-verification.integration.test.tsx`
Integration tests for the mentor verification workflow from admin perspective.

**Key Test Areas:**
- Admin dashboard functionality
- Mentor verification API calls
- Status update propagation
- Public listing updates

### `appointment-calendar.integration.test.tsx`
Integration tests for appointment booking and Google Calendar integration.

**Key Test Areas:**
- Appointment booking flow
- Calendar event creation
- Conflict detection
- Dashboard appointment display

### `test-runner.integration.test.tsx`
Comprehensive end-to-end test scenarios combining multiple workflows.

**Key Test Areas:**
- Complete user journeys
- Cross-feature integration
- Error handling across workflows
- Role-based access control

## Tipos de Teste - Esclarecimento

### 🧪 O que são estes "Testes de Integração"?

**Importante:** Os testes neste diretório são mais precisamente **testes de integração de API/serviços** usando Jest, não testes E2E completos.

#### Hierarquia de Testes:
1. **Testes Unitários** (Jest)
   - Testam funções/componentes isolados
   - Mockam todas as dependências
   - Exemplo: `useAuth.test.ts`

2. **Testes de Integração** (Jest + Testing Library) ← **Estamos aqui**
   - Testam múltiplos componentes/serviços juntos
   - Mocks parciais (APIs, mas não lógica de negócio)
   - Exemplo: Fluxo completo de autenticação

3. **Testes End-to-End** (Cypress/Playwright)
   - Testam aplicação completa no navegador
   - Sem mocks, sistemas reais
   - Exemplo: Usuário real fazendo signup → login → booking

### 🎯 Por que Jest para Integração?

- **Velocidade**: Mais rápido que E2E (segundos vs minutos)
- **Confiabilidade**: Menos flaky que testes de navegador
- **CI/CD**: Ideal para pipelines de integração contínua
- **Debugging**: Mais fácil de debuggar que E2E

## Executando os Testes

### 🚀 Executar Todos os Testes de Integração
```bash
# Executa todos os testes do diretório integration
npm test -- --testPathPattern=integration

# Alternativa mais específica
npm test -- __tests__/integration/
```

### 📁 Executar Teste Específico
```bash
# Teste principal (recomendado - mais estável)
npm test -- __tests__/integration/auth-integration.test.ts

# Testes específicos por funcionalidade
npm test -- __tests__/integration/auth-flow.integration.test.tsx
npm test -- __tests__/integration/mentor-verification.integration.test.tsx
npm test -- __tests__/integration/appointment-calendar.integration.test.tsx
npm test -- __tests__/integration/test-runner.integration.test.tsx
```

### 🔍 Executar com Opções Avançadas
```bash
# Com coverage detalhado
npm test -- --testPathPattern=integration --coverage

# Modo watch (re-executa ao salvar)
npm test -- --testPathPattern=integration --watch

# Verbose (mostra todos os testes)
npm test -- --testPathPattern=integration --verbose

# Apenas testes que falharam
npm test -- --testPathPattern=integration --onlyFailures
```

### 🎯 Executar Testes por Categoria
```bash
# Apenas testes de API
npm test -- --testNamePattern="API Endpoint"

# Apenas testes de erro
npm test -- --testNamePattern="Error Handling"

# Apenas testes de autenticação
npm test -- --testNamePattern="Authentication Flow"

# Apenas testes de Google Calendar
npm test -- --testNamePattern="Google Calendar"
```

### 📊 Executar Todos os Tipos de Teste
```bash
# Todos os testes (unitários + integração)
npm test

# Apenas testes unitários (exclui integração)
npm test -- --testPathIgnorePatterns=integration

# Com coverage completo
npm test -- --coverage --coverageDirectory=coverage
```

### 🐛 Debug e Desenvolvimento
```bash
# Executa um teste específico em modo debug
npm test -- __tests__/integration/auth-integration.test.ts --verbose --no-cache

# Para debuggar com breakpoints (VS Code)
npm test -- --runInBand --no-cache __tests__/integration/auth-integration.test.ts
```

## 🚀 Comandos Rápidos de Execução

### Executar Todos os Testes
```bash
# Todos os testes de integração
npm test -- --testPathPattern=integration

# Teste principal (mais estável)
npm test -- __tests__/integration/auth-integration.test.ts

# Com coverage
npm test -- --testPathPattern=integration --coverage
```

### Executar Testes Específicos
```bash
# Por funcionalidade
npm test -- __tests__/integration/auth-flow.integration.test.tsx
npm test -- __tests__/integration/mentor-verification.integration.test.tsx
npm test -- __tests__/integration/appointment-calendar.integration.test.tsx

# Por categoria (usando pattern)
npm test -- --testNamePattern="API Endpoint"
npm test -- --testNamePattern="Error Handling"
npm test -- --testNamePattern="Google Calendar"
```

### Modo Desenvolvimento
```bash
# Watch mode (re-executa ao salvar)
npm test -- --testPathPattern=integration --watch

# Verbose (mostra detalhes)
npm test -- --testPathPattern=integration --verbose

# Debug específico
npm test -- __tests__/integration/auth-integration.test.ts --verbose --no-cache
```

## Test Requirements Validation

### ✅ Requirement 4.5 - Complete Signup Flow
- [x] Email/password signup
- [x] OAuth provider signup (Google, LinkedIn)
- [x] Email confirmation handling
- [x] Profile creation after confirmation

### ✅ Requirement 5.5 - Login with Different Providers
- [x] Email/password login
- [x] Google OAuth login
- [x] LinkedIn OAuth login
- [x] Error handling for unconfirmed emails
- [x] Invalid credential handling

### ✅ Requirement 6.5 - Role Selection Flow
- [x] Mandatory role selection after signup
- [x] Mentor/mentee role options
- [x] Role persistence in database
- [x] Dashboard redirection based on role

### ✅ Requirement 9.5 - Mentor Verification
- [x] Admin verification interface
- [x] Mentor status updates
- [x] Public listing integration
- [x] Access control validation

### ✅ Requirement 11.5 - Appointment and Calendar
- [x] Appointment booking flow
- [x] Google Calendar event creation
- [x] Google Meet link generation
- [x] Conflict detection and handling

## Mock Strategy

The integration tests use a layered mocking approach:

1. **API Mocking**: Global `fetch` mock for API endpoint testing
2. **Component Mocking**: Minimal Next.js router mocking
3. **Service Mocking**: Supabase client mocking for database operations
4. **External Service Mocking**: Google Calendar API mocking

## Continuous Integration

These tests are designed to run in CI/CD environments and validate:
- API contract compliance
- Error handling robustness
- Security requirement adherence
- Business logic correctness
- Integration point stability

## Quando Usar Cada Tipo de Teste

### 🧪 Testes Unitários (Jest)
**Use quando:**
- Testar lógica de uma função específica
- Validar comportamento de um hook isolado
- Testar componentes sem dependências externas

**Exemplo:**
```javascript
// Testa apenas a função de validação
test('should validate email format', () => {
  expect(validateEmail('test@example.com')).toBe(true)
  expect(validateEmail('invalid')).toBe(false)
})
```

### 🔗 Testes de Integração (Jest + Testing Library)
**Use quando:**
- Testar fluxos completos de funcionalidades
- Validar integração entre múltiplos componentes
- Testar APIs e lógica de negócio
- Validar contratos entre serviços

**Exemplo:**
```javascript
// Testa signup + confirmação + role selection
test('should complete user onboarding flow', async () => {
  // Testa múltiplas etapas trabalhando juntas
})
```

### 🌐 Testes E2E (Cypress/Playwright)
**Use quando:**
- Testar jornadas críticas do usuário
- Validar funcionalidade em navegadores reais
- Testar integrações com serviços externos reais
- Validar performance e acessibilidade

**Exemplo:**
```javascript
// Cypress - testa no navegador real
cy.visit('/signup')
cy.get('[data-testid="email"]').type('user@example.com')
cy.get('[data-testid="submit"]').click()
cy.url().should('include', '/dashboard')
```

## Estratégia de Teste Recomendada

### 🏗️ Pirâmide de Testes
```
        /\
       /E2E\     ← Poucos, críticos, lentos
      /____\
     /      \
    /Integr.\   ← Moderados, fluxos, médios
   /________\
  /          \
 /  Unitários \ ← Muitos, rápidos, isolados
/______________\
```

### 📋 Para Este Projeto:
- **70% Unitários**: Funções, hooks, componentes isolados
- **25% Integração**: Fluxos de auth, APIs, lógica de negócio
- **5% E2E**: Jornadas críticas (signup, booking, payment)

## Future Enhancements

### 🚀 Próximos Passos Recomendados:

1. **Testes E2E com Playwright**
   ```bash
   npm install @playwright/test
   # Criar testes para jornadas críticas
   ```

2. **Testes de Performance**
   ```bash
   npm install @jest/test-utils
   # Testes de load para APIs críticas
   ```

3. **Testes Visuais**
   ```bash
   npm install @storybook/test-runner
   # Screenshot testing para componentes
   ```

4. **Testes de Acessibilidade**
   ```bash
   npm install @axe-core/playwright
   # Validação automática de a11y
   ```

5. **Testes de Banco Real**
   ```bash
   # Docker + PostgreSQL para testes de integração
   # Migrations automáticas para ambiente de teste
   ```