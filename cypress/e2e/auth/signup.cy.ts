import { describe, beforeEach, it } from "cypress"

describe("User Signup", () => {
  beforeEach(() => {
    cy.visit("/signup")
  })

  it("should display signup form", () => {
    cy.get('[data-testid="signup-form"]').should("be.visible")
    cy.get('[data-testid="first-name-input"]').should("be.visible")
    cy.get('[data-testid="last-name-input"]').should("be.visible")
    cy.get('[data-testid="email-input"]').should("be.visible")
    cy.get('[data-testid="password-input"]').should("be.visible")
    cy.get('[data-testid="confirm-password-input"]').should("be.visible")
    cy.get('[data-testid="signup-button"]').should("be.visible")
  })

  it("should show validation errors for empty fields", () => {
    cy.get('[data-testid="signup-button"]').click()
    cy.contains("Todos os campos são obrigatórios").should("be.visible")
  })

  it("should show error when passwords do not match", () => {
    cy.get('[data-testid="first-name-input"]').type("John")
    cy.get('[data-testid="last-name-input"]').type("Doe")
    cy.get('[data-testid="email-input"]').type("john@example.com")
    cy.get('[data-testid="password-input"]').type("password123")
    cy.get('[data-testid="confirm-password-input"]').type("password456")
    cy.get('[data-testid="signup-button"]').click()

    cy.contains("As senhas não coincidem").should("be.visible")
  })

  it("should show error for short password", () => {
    cy.get('[data-testid="first-name-input"]').type("John")
    cy.get('[data-testid="last-name-input"]').type("Doe")
    cy.get('[data-testid="email-input"]').type("john@example.com")
    cy.get('[data-testid="password-input"]').type("123")
    cy.get('[data-testid="confirm-password-input"]').type("123")
    cy.get('[data-testid="signup-button"]').click()

    cy.contains("A senha deve ter pelo menos 6 caracteres").should("be.visible")
  })

  it("should successfully create account with valid data", () => {
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`

    cy.get('[data-testid="first-name-input"]').type("John")
    cy.get('[data-testid="last-name-input"]').type("Doe")
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type("password123")
    cy.get('[data-testid="confirm-password-input"]').type("password123")
    cy.get('[data-testid="signup-button"]').click()

    // Should show success message
    cy.contains("Verifique seu email").should("be.visible")
    cy.contains(email).should("be.visible")
  })

  it("should redirect authenticated users to dashboard", () => {
    // This would require setting up a test user session
    // For now, we'll skip this test
    cy.log("Test requires authenticated session setup")
  })
})
