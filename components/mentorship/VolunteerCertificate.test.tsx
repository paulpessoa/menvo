import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { VolunteerCertificate } from "./VolunteerCertificate"
import type { MentorCertificateData } from "@/lib/services/mentors/mentor-certificate.service"

const mockData: MentorCertificateData = {
  mentorId: "11111111-2222-3333-4444-555566667777",
  slug: "paulo-pessoa",
  mentorName: "Paulo Pessoa",
  mentorTitle: "Fundador & Mentor",
  memberSinceIso: "2024-01-01T00:00:00Z",
  memberSinceFormatted: "01 de janeiro de 2024",
  issueDateFormatted: "14 de outubro de 2026",
  totalSessions: 25,
  totalHours: 18.8,
  totalMinutes: 1125,
  averageRating: 5.0,
  totalReviews: 24,
  verificationCode: "MV-11111111-0019",
  verificationUrl: "https://www.menvo.com.br/certificate/paulo-pessoa",
  isValid: true
}

describe("VolunteerCertificate", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
    window.print = jest.fn()
  })

  it("renders certificate details correctly", () => {
    render(<VolunteerCertificate data={mockData} />)

    expect(screen.getByText("Certificado de Atuação Voluntária")).toBeInTheDocument()
    expect(screen.getByText("Paulo Pessoa")).toBeInTheDocument()
    expect(screen.getByText("18,8 h")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
    expect(screen.getByText("Sessões concluídas")).toBeInTheDocument()
    expect(screen.getByText("5,0")).toBeInTheDocument()
    expect(screen.getByText("Nota média (24 avaliações)")).toBeInTheDocument()
    expect(screen.getAllByText(/MV-11111111-0019/).length).toBeGreaterThanOrEqual(1)
  })

  it("never shows a rating that does not exist, and shows short sessions in minutes", () => {
    render(<VolunteerCertificate data={{ ...mockData, totalSessions: 1, totalHours: 0.8, totalMinutes: 45, averageRating: null, totalReviews: 0 }} />)

    expect(screen.getByText("45 min")).toBeInTheDocument()
    expect(screen.getByText("Sessão concluída")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.getByText("Ainda sem avaliações")).toBeInTheDocument()
    expect(screen.queryByText(/5[.,]0/)).not.toBeInTheDocument()
  })

  it("calls window.print when clicking Imprimir", () => {
    render(<VolunteerCertificate data={mockData} />)

    const printButton = screen.getByRole("button", { name: /Imprimir/i })
    fireEvent.click(printButton)

    expect(window.print).toHaveBeenCalled()
  })

  it("copies verification link when clicking Copiar link", () => {
    render(<VolunteerCertificate data={mockData} />)

    const copyButton = screen.getByRole("button", { name: /Copiar link/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.menvo.com.br/certificate/paulo-pessoa"
    )
  })
})
