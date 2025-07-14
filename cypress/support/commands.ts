/// <reference types="cypress" />

import { cy } from "cypress"

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      signup(firstName: string, lastName: string, email: string, password: string): Chainable<void>
      completeProfile(firstName: string, lastName: string, role: string): Chainable<void>
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login")
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
})

Cypress.Commands.add("signup", (firstName: string, lastName: string, email: string, password: string) => {
  cy.visit("/signup")
  cy.get('[data-testid="first-name-input"]').type(firstName)
  cy.get('[data-testid="last-name-input"]').type(lastName)
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="confirm-password-input"]').type(password)
  cy.get('[data-testid="signup-button"]').click()
})

Cypress.Commands.add("completeProfile", (firstName: string, lastName: string, role: string) => {
  cy.get('[data-testid="first-name-input"]').clear().type(firstName)
  cy.get('[data-testid="last-name-input"]').clear().type(lastName)
  cy.get('[data-testid="role-select"]').click()
  cy.get(`[data-value="${role}"]`).click()
  cy.get('[data-testid="complete-profile-button"]').click()
})
