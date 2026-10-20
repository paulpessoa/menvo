import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import type { OrgDashboardImpact, OrgDashboardSummary } from "@/lib/domain/organizations/organization.entity"
import { ImpactCards } from "./ImpactCards"
import { ImpactToolbar } from "./ImpactToolbar"
import { SummaryCards } from "./SummaryCards"

const impact: OrgDashboardImpact = {
  period: "all",
  totalSessionsCompleted: 12,
  totalHoursCompleted: 8.5,
  totalDiagnosticsDone: 4,
  averageRating: 4.25,
}

describe("ImpactToolbar", () => {
  function setup(over: Partial<React.ComponentProps<typeof ImpactToolbar>> = {}) {
    const props = { period: "all" as const, onPeriodChange: jest.fn(), onExport: jest.fn(), exportDisabled: false, ...over }
    render(<ImpactToolbar {...props} />)
    return props
  }

  it("offers the four periods and reports the chosen one", () => {
    const props = setup()
    for (const label of ["Tudo", "30 dias", "90 dias", "1 ano"]) expect(screen.getByText(label)).toBeInTheDocument()
    fireEvent.click(screen.getByText("90 dias"))
    expect(props.onPeriodChange).toHaveBeenCalledWith("90d")
  })

  it("highlights only the current period", () => {
    setup({ period: "30d" })
    expect(screen.getByText("30 dias")).toHaveClass("bg-primary")
    expect(screen.getByText("Tudo")).not.toHaveClass("bg-primary")
  })

  it("exports on click and can be disabled", () => {
    const props = setup()
    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }))
    expect(props.onExport).toHaveBeenCalledTimes(1)
  })

  it("disables the export when there is nothing to export", () => {
    setup({ exportDisabled: true })
    expect(screen.getByRole("button", { name: /Exportar CSV/ })).toBeDisabled()
  })
})

describe("ImpactCards", () => {
  it("shows hours, sessions, diagnostics and the rounded average rating", () => {
    render(<ImpactCards impact={impact} />)
    expect(screen.getByText("8.5h")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("4.3 ★")).toBeInTheDocument()
    expect(screen.getByText("Avaliação média")).toBeInTheDocument()
  })

  it("shows a dash when there is no rating", () => {
    render(<ImpactCards impact={{ ...impact, averageRating: null }} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

describe("SummaryCards", () => {
  it("shows beneficiaries, mentors and booked + given sessions summed", () => {
    const summary: OrgDashboardSummary = {
      beneficiaries: 6,
      mentors: 2,
      pendingRequests: 0,
      pendingInvites: 0,
      sessionsBookedByBeneficiaries: 5,
      sessionsGivenByOrgMentors: 3,
      impact,
    }
    render(<SummaryCards summary={summary} />)
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText("Sessões (agendadas + dadas)")).toBeInTheDocument()
  })
})
