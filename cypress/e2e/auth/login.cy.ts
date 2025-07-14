import { describe, beforeEach, it } from "cypress"
import { cy } from "cypress"

describe("User Login", () => {
  beforeEach(() => {
    cy.visit("/login")
  })

  it("should display login form", () => {
    cy.get('[data-testid="login-form"]').should("be.visible")
    cy.get('[data-testid="email-input"]').should("be.visible")
    cy.get('[data-testid="password-input"]').should("be.visible")
    cy.get('[data-testid="login-button"]').should("be.visible")
  })

  it("should show validation errors for empty fields", () => {
    cy.get('[data-testid="login-button"]').click()
    cy.contains("Email e senha são obrigatórios").should("be.visible")
  })

  it("should show error for invalid credentials", () => {
    cy.get('[data-testid="email-input"]').type("invalid@example.com")
    cy.get('[data-testid="password-input"]').type("wrongpassword")
    cy.get('[data-testid="login-button"]').click()

    // Should show error message (exact message depends on Supabase response)
    cy.get('[data-testid="error-alert"]').should("be.visible")
  })

  it("should have forgot password link", () => {
    cy.contains("Esqueceu sua senha?").should("be.visible")
    cy.contains("Esqueceu sua senha?").click()
    cy.url().should("include", "/forgot-password")
  })

  it("should have signup link", () => {
    cy.contains("Criar conta").should("be.visible")
    cy.contains("Criar conta").click()
    cy.url().should("include", "/signup")
  })

  it("should successfully login with valid credentials", () => {
    // This test requires a test user to exist in the database
    // For demo purposes, we'll use placeholder credentials
    cy.get('[data-testid="email-input"]').type("test@example.com")
    cy.get('[data-testid="password-input"]').type("password123")
    cy.get('[data-testid="login-button"]').click()

    // Should redirect based on user role
    // If pending role -> /welcome
    // If active role -> /dashboard
    cy.url().should("match", /\/(welcome|dashboard)/)
  })
})
