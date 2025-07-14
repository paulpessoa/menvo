import { describe, beforeEach, it } from "mocha"
import { cy } from "cypress"

describe("Forgot Password", () => {
  beforeEach(() => {
    cy.visit("/forgot-password")
  })

  it("should display forgot password form", () => {
    cy.get('[data-testid="forgot-password-form"]').should("be.visible")
    cy.get('[data-testid="email-input"]').should("be.visible")
    cy.get('[data-testid="reset-button"]').should("be.visible")
  })

  it("should show validation error for empty email", () => {
    cy.get('[data-testid="reset-button"]').click()
    cy.contains("Email é obrigatório").should("be.visible")
  })

  it("should successfully send reset email", () => {
    cy.get('[data-testid="email-input"]').type("test@example.com")
    cy.get('[data-testid="reset-button"]').click()

    // Should show success message
    cy.contains("Email enviado").should("be.visible")
    cy.contains("test@example.com").should("be.visible")
  })

  it("should have back to login link", () => {
    cy.contains("Voltar para Login").should("be.visible")
    cy.contains("Voltar para Login").click()
    cy.url().should("include", "/login")
  })
})
