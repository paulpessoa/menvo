import { describe, beforeEach, it } from "cypress"
import { cy } from "cypress"

describe("Welcome Page (Profile Completion)", () => {
  beforeEach(() => {
    // This test assumes user is logged in with pending role
    // In a real test, you'd set up the auth state properly
    cy.visit("/welcome")
  })

  it("should display welcome form", () => {
    cy.get('[data-testid="welcome-form"]').should("be.visible")
    cy.get('[data-testid="first-name-input"]').should("be.visible")
    cy.get('[data-testid="last-name-input"]').should("be.visible")
    cy.get('[data-testid="role-select"]').should("be.visible")
    cy.get('[data-testid="complete-profile-button"]').should("be.visible")
  })

  it("should show validation errors for empty fields", () => {
    cy.get('[data-testid="complete-profile-button"]').click()
    cy.contains("Todos os campos são obrigatórios").should("be.visible")
  })

  it("should display role options", () => {
    cy.get('[data-testid="role-select"]').click()
    cy.contains("Mentee - Quero receber mentoria").should("be.visible")
    cy.contains("Mentor - Quero oferecer mentoria").should("be.visible")
    cy.contains("Voluntário - Quero ajudar em atividades").should("be.visible")
  })

  it("should successfully complete profile", () => {
    cy.get('[data-testid="first-name-input"]').type("John")
    cy.get('[data-testid="last-name-input"]').type("Doe")
    cy.get('[data-testid="role-select"]').click()
    cy.get('[data-value="mentee"]').click()
    cy.get('[data-testid="complete-profile-button"]').click()

    // Should redirect to dashboard after completion
    cy.url().should("include", "/dashboard")
  })
})
