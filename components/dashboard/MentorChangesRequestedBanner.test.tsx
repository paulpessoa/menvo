import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { MentorChangesRequestedBanner } from "./MentorChangesRequestedBanner"

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

describe("MentorChangesRequestedBanner", () => {
  it("does not render when verificationStatus is not changes_requested", () => {
    const { container: pendingContainer } = render(
      <MentorChangesRequestedBanner verificationStatus="pending" />
    )
    expect(pendingContainer).toBeEmptyDOMElement()

    const { container: approvedContainer } = render(
      <MentorChangesRequestedBanner verificationStatus="approved" />
    )
    expect(approvedContainer).toBeEmptyDOMElement()

    const { container: nullContainer } = render(
      <MentorChangesRequestedBanner verificationStatus={null} />
    )
    expect(nullContainer).toBeEmptyDOMElement()
  })

  it("renders warning banner with action link when verificationStatus is changes_requested", () => {
    render(<MentorChangesRequestedBanner verificationStatus="changes_requested" />)

    expect(
      screen.getByText(/ajustes solicitados na sua candidatura a mentor/i)
    ).toBeInTheDocument()

    const link = screen.getByRole("link", { name: /revisar perfil/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/profile?tab=mentorship")
  })
})
