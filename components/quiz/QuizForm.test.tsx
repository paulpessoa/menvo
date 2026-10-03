import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QuizForm } from "./QuizForm"
import { QuizRadioStep } from "./steps/QuizRadioStep"
import { QuizAreasStep } from "./steps/QuizAreasStep"
import { QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION } from "@/lib/quiz/draft"
import { writeDraft } from "@/hooks/usePersistentDraft"

// Devolve a chave + parâmetros, para dar para conferir "etapa 2 de 8" sem depender do texto traduzido.
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key
}))

// O campo de voz usa APIs do navegador que o jsdom não tem; estes testes não passam por ele.
jest.mock("@/components/ui/textarea-with-voice", () => ({
  TextareaWithVoice: () => <textarea />
}))

const options = [
  { value: "a", label: "Opção A" },
  { value: "b", label: "Opção B" }
]

beforeEach(() => window.localStorage.clear()) // o rascunho persiste entre testes do mesmo arquivo

describe("QuizRadioStep", () => {
  it("selects when the option text is clicked, exactly once", async () => {
    const onChange = jest.fn()
    render(<QuizRadioStep value={undefined} onChange={onChange} options={options} />)

    await userEvent.setup({ delay: null }).click(screen.getByText("Opção B"))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("b")
  })

  it("highlights only the selected option", () => {
    render(<QuizRadioStep value="a" onChange={() => {}} options={options} />)

    expect(screen.getByText("Opção A").closest("label")).toHaveClass("border-primary", "bg-accent")
    expect(screen.getByText("Opção B").closest("label")).not.toHaveClass("border-primary")
    expect(screen.getByRole("radio", { name: "Opção A" })).toBeChecked()
  })
})

describe("QuizAreasStep", () => {
  const baseProps = {
    options,
    onChangeOther: () => {},
    selectAllText: "Selecione todas",
    otherAreaSpecifyText: "Outra área",
    otherAreaPlaceholder: "Digite"
  }

  it("toggles once per click on the card text (no double toggle from the label)", async () => {
    const onToggleArea = jest.fn()
    render(<QuizAreasStep {...baseProps} selectedAreas={[]} onToggleArea={onToggleArea} />)

    await userEvent.setup({ delay: null }).click(screen.getByText("Opção A"))

    expect(onToggleArea).toHaveBeenCalledTimes(1)
    expect(onToggleArea).toHaveBeenCalledWith("a")
  })

  it("also toggles when the checkbox itself is clicked, once", async () => {
    const onToggleArea = jest.fn()
    render(<QuizAreasStep {...baseProps} selectedAreas={[]} onToggleArea={onToggleArea} />)

    await userEvent.setup({ delay: null }).click(screen.getByRole("checkbox", { name: "Opção B" }))

    expect(onToggleArea).toHaveBeenCalledTimes(1)
    expect(onToggleArea).toHaveBeenCalledWith("b")
  })

  it("highlights the selected areas", () => {
    render(<QuizAreasStep {...baseProps} selectedAreas={["b"]} onToggleArea={() => {}} />)

    expect(screen.getByText("Opção B").closest("label")).toHaveClass("border-primary", "bg-accent")
    expect(screen.getByText("Opção A").closest("label")).not.toHaveClass("border-primary")
  })
})

describe("QuizForm", () => {
  const progress = (step: number, total = 8) =>
    `quiz_form.progress_header:${JSON.stringify({ currentStep: step, totalSteps: total })}`

  it("blocks Next until an answer is chosen, then advances", async () => {
    const user = userEvent.setup({ delay: null })
    render(<QuizForm onSubmit={jest.fn()} onBack={jest.fn()} />)

    expect(screen.getByText(progress(1))).toBeInTheDocument()
    const next = screen.getByRole("button", { name: /quiz_form\.next/ })
    expect(next).toBeDisabled()

    await user.click(screen.getByText("quiz_form.university_student"))
    expect(next).toBeEnabled()

    await user.click(next)
    expect(screen.getByText(progress(2))).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("quiz_form.professional_challenge_title")
  })

  it("Back on the first question leaves the quiz; on later ones it goes one step back", async () => {
    const user = userEvent.setup({ delay: null })
    const onBack = jest.fn()
    render(<QuizForm onSubmit={jest.fn()} onBack={onBack} />)

    await user.click(screen.getByRole("button", { name: /quiz_form\.back/ }))
    expect(onBack).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText("quiz_form.recent_graduate"))
    await user.click(screen.getByRole("button", { name: /quiz_form\.next/ }))
    expect(screen.getByText(progress(2))).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /quiz_form\.back/ }))
    expect(screen.getByText(progress(1))).toBeInTheDocument()
    expect(onBack).toHaveBeenCalledTimes(1)
    // a resposta anterior continua marcada ao voltar
    expect(screen.getByRole("radio", { name: "quiz_form.recent_graduate" })).toBeChecked()
  })

  it("has one step fewer for signed-in users", () => {
    render(<QuizForm onSubmit={jest.fn()} onBack={jest.fn()} isAuthenticated />)
    expect(screen.getByText(progress(1, 7))).toBeInTheDocument()
  })

  it("restores the saved answers and step after a reload", () => {
    writeDraft(QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION, { currentStep: 2, answers: { careerMoment: "transicao" } })
    render(<QuizForm onSubmit={jest.fn()} onBack={jest.fn()} />)
    expect(screen.getByText(progress(2))).toBeInTheDocument()
  })

  it("ignores a draft from another version", () => {
    writeDraft(QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION + 1, { currentStep: 2, answers: {} })
    render(<QuizForm onSubmit={jest.fn()} onBack={jest.fn()} />)
    expect(screen.getByText(progress(1))).toBeInTheDocument()
  })

  it("saves answers as the person goes, but never name, e-mail or LinkedIn", async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <QuizForm
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        initialData={{ name: "Ana Silva", email: "ana@example.com", linkedinUrl: "https://linkedin.com/in/ana" }}
      />
    )

    await user.click(screen.getByText("quiz_form.university_student"))
    await user.click(screen.getByRole("button", { name: /quiz_form\.next/ }))

    const saved = window.localStorage.getItem(QUIZ_DRAFT_KEY) ?? ""
    expect(saved).toContain("estudante-universitario")
    expect(saved).not.toMatch(/ana@example\.com|Ana Silva|linkedin/)
  })

  it("exposes progress to assistive technology", () => {
    render(<QuizForm onSubmit={jest.fn()} onBack={jest.fn()} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", progress(1))
  })
})
