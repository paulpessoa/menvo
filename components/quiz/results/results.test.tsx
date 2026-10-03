import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SuggestedMentors } from "./SuggestedMentors"
import { RetakeNotice } from "./RetakeNotice"
import { ActionPlan, FinalMessage } from "./ResultSections"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "pt-BR",
}))
jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const mentors = [
  { tipo: "Dados", razao: "Casa com seu objetivo", disponivel: true, mentor_nome: "Ana Souza" },
  { tipo: "Carreira", razao: "Ajuda na transição", disponivel: false, mentor_nome: "Bia Lima" },
  { tipo: "Geral", razao: "Perfil amplo", disponivel: false },
]

describe("SuggestedMentors", () => {
  const slugs = { slugByName: { "ana souza": "ana-souza" }, idByName: { "ana souza": "m1" } }

  it("links to the real profile when the name resolved, to a search when not, to the list when there is no name", () => {
    render(<SuggestedMentors mentors={mentors} slugs={slugs} canShare={false} onShare={() => {}} />)

    expect(screen.getByText("Ana Souza").closest("a")).toHaveAttribute("href", "/mentors/ana-souza")
    expect(screen.getByText("Bia Lima").closest("a")).toHaveAttribute("href", "/mentors?search=Bia%20Lima")
    expect(screen.getByText("Geral").closest("a")).toHaveAttribute("href", "/mentors")
  })

  it("marks only available mentors", () => {
    render(<SuggestedMentors mentors={mentors} slugs={slugs} canShare={false} onShare={() => {}} />)
    expect(screen.getAllByLabelText("quiz_results.available")).toHaveLength(1)
  })

  it("offers sharing with a mentor only to the owner", async () => {
    const onShare = jest.fn()
    const { rerender } = render(<SuggestedMentors mentors={mentors} slugs={slugs} canShare={false} onShare={onShare} />)
    expect(screen.queryByRole("button", { name: /share_with_mentor/ })).not.toBeInTheDocument()

    rerender(<SuggestedMentors mentors={mentors} slugs={slugs} canShare onShare={onShare} />)
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: /share_with_mentor/ }))
    expect(onShare).toHaveBeenCalledTimes(1)
  })
})

describe("result sections", () => {
  it("ActionPlan numbers the steps in order", () => {
    render(<ActionPlan steps={["Primeiro", "Segundo"]} />)
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("1Primeiro")
    expect(items[1]).toHaveTextContent("2Segundo")
  })

  it("FinalMessage renders as a quote", () => {
    render(<FinalMessage message="Boa sorte!" />)
    expect(screen.getByText("Boa sorte!").tagName).toBe("BLOCKQUOTE")
  })

  it("RetakeNotice shows the message, the tips and a single way out (retake)", () => {
    const analysis = {
      precisa_refazer: true,
      titulo_personalizado: "Vamos refazer?",
      resumo_motivador: "Respostas curtas demais.",
      mentores_sugeridos: [],
      conselhos_praticos: ["Conte um exemplo real"],
      proximos_passos: [],
      areas_desenvolvimento: [],
      mensagem_final: "",
    } satisfies QuizAnalysis
    render(<RetakeNotice analysis={analysis} />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vamos refazer?")
    expect(screen.getByText("Conte um exemplo real")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /retake_quiz/ })).toHaveAttribute("href", "/quiz")
  })
})
