import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import type { OrgDashboardMember } from "@/lib/domain/organizations/organization.entity"
import { MembersCard } from "./MembersCard"
import { MembersTable } from "./MembersTable"

function member(over: Partial<OrgDashboardMember>): OrgDashboardMember {
  return {
    userId: "u1",
    role: "member",
    status: "active",
    platformRole: "mentee",
    joinedAt: "2026-01-01",
    fullName: "Ana",
    email: "ana@x.org",
    sessionsBooked: 3,
    sessionsGiven: 7,
    quizDone: true,
    ...over,
  }
}

describe("MembersTable", () => {
  it("booked variant shows quiz and booked sessions", () => {
    render(<MembersTable members={[member({})]} variant="booked" onRemove={jest.fn()} busyUserId={null} />)
    expect(screen.getByText("Quiz")).toBeInTheDocument()
    expect(screen.getByText("Sessões")).toBeInTheDocument()
    expect(screen.getByText("Sim")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.queryByText("7")).not.toBeInTheDocument()
  })

  it("given variant shows only sessions given", () => {
    render(<MembersTable members={[member({})]} variant="given" onRemove={jest.fn()} busyUserId={null} />)
    expect(screen.getByText("Sessões dadas")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.queryByText("Quiz")).not.toBeInTheDocument()
  })

  it("marks an invited member and cancels the invite on remove", () => {
    const onRemove = jest.fn()
    const { container } = render(
      <MembersTable members={[member({ status: "invited" })]} variant="booked" onRemove={onRemove} busyUserId={null} />
    )
    expect(screen.getByText("Convidado")).toBeInTheDocument()
    expect(container.querySelector("tbody tr")).toHaveClass("opacity-60")
    fireEvent.click(screen.getByLabelText("Remover"))
    expect(onRemove).toHaveBeenCalledWith("u1", "Convite cancelado")
  })

  it("removing an active member reports 'Membro removido'", () => {
    const onRemove = jest.fn()
    render(<MembersTable members={[member({})]} variant="booked" onRemove={onRemove} busyUserId={null} />)
    fireEvent.click(screen.getByLabelText("Remover"))
    expect(onRemove).toHaveBeenCalledWith("u1", "Membro removido")
  })

  it("admins have no remove button", () => {
    render(<MembersTable members={[member({ role: "admin" })]} variant="booked" onRemove={jest.fn()} busyUserId={null} />)
    expect(screen.getByText("Admin")).toBeInTheDocument()
    expect(screen.queryByLabelText("Remover")).not.toBeInTheDocument()
  })

  it("disables the button only for the busy row", () => {
    render(
      <MembersTable
        members={[member({ userId: "u1" }), member({ userId: "u2" })]}
        variant="booked"
        onRemove={jest.fn()}
        busyUserId="u2"
      />
    )
    const [first, second] = screen.getAllByLabelText("Remover")
    expect(first).not.toBeDisabled()
    expect(second).toBeDisabled()
  })

  it("shows '-' for a missing name or e-mail", () => {
    render(<MembersTable members={[member({ fullName: null, email: null })]} variant="booked" onRemove={jest.fn()} busyUserId={null} />)
    expect(screen.getAllByText("-")).toHaveLength(2)
  })
})

describe("MembersCard", () => {
  it("shows the empty message instead of a table when there are no members", () => {
    render(
      <MembersCard title="Beneficiários (0)" members={[]} variant="booked" emptyMessage="Ninguém ainda" onRemove={jest.fn()} busyUserId={null} />
    )
    expect(screen.getByText("Beneficiários (0)")).toBeInTheDocument()
    expect(screen.getByText("Ninguém ainda")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders the table when there are members", () => {
    render(
      <MembersCard title="Mentores (1)" members={[member({})]} variant="given" emptyMessage="x" onRemove={jest.fn()} busyUserId={null} />
    )
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})
