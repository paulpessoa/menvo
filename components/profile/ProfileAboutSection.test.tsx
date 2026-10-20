import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProfileAboutSection } from "./ProfileAboutSection"
import type { ProfileFormData } from "./profile-form"

jest.mock("@/lib/auth", () => ({ useAuth: () => ({ refreshProfile: jest.fn() }) }))
jest.mock("@/hooks/useSimpleUpload", () => ({
  useSimpleImageUpload: () => ({ upload: jest.fn(), isUploading: false }),
}))
jest.mock("@/hooks/useDetectLocation", () => ({
  useDetectLocation: () => ({ detect: jest.fn(), isDetecting: false }),
}))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const form = {
  first_name: "Ana Maria",
  last_name: "Sousa",
  slug: "",
  bio: "",
  city: "Recife",
  state: "PE",
  country: "Brasil",
  timezone: "America/Recife",
  avatar_url: "",
  is_public: true,
} as unknown as ProfileFormData

describe("ProfileAboutSection", () => {
  it("shows the mentor wording of the public switch only for mentors", () => {
    const { rerender } = render(<ProfileAboutSection form={form} onChange={jest.fn()} isMentor />)
    expect(screen.getByText("Aparecer no diretório de mentores.")).toBeInTheDocument()

    rerender(<ProfileAboutSection form={form} onChange={jest.fn()} isMentor={false} />)
    expect(screen.getByText(/mural de mentorados/i)).toBeInTheDocument()
  })

  it("keeps the element id the guided tour points at", () => {
    const { container } = render(<ProfileAboutSection form={form} onChange={jest.fn()} isMentor />)
    expect(container.querySelector("#tour-profile-public")).not.toBeNull()
  })

  it("turning the switch reports is_public to the form", async () => {
    const onChange = jest.fn()
    render(<ProfileAboutSection form={form} onChange={onChange} isMentor />)
    await userEvent.click(screen.getByRole("switch"))
    expect(onChange).toHaveBeenCalledWith({ is_public: false })
  })

  it("generates the slug from the name, without accents-breaking characters or spaces", async () => {
    const onChange = jest.fn()
    render(<ProfileAboutSection form={form} onChange={onChange} isMentor />)
    await userEvent.click(screen.getByRole("button", { name: /gerar automaticamente/i }))
    expect(onChange).toHaveBeenCalledWith({ slug: "ana-maria-sousa" })
  })

  it("normalizes what is typed into the slug field", async () => {
    const onChange = jest.fn()
    render(<ProfileAboutSection form={form} onChange={onChange} isMentor />)
    await userEvent.type(screen.getByPlaceholderText("ex: maria-silva"), "A")
    expect(onChange).toHaveBeenCalledWith({ slug: "a" })
  })
})
