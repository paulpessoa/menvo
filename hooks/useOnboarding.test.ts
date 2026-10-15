/**
 * @jest-environment jsdom
 */
import { resolveTourSteps } from "./useOnboarding"

jest.mock("@/lib/auth", () => ({ useAuth: jest.fn() }))
jest.mock("driver.js", () => ({ driver: jest.fn() }))
jest.mock("driver.js/dist/driver.css", () => ({}))

/** O jsdom não faz layout: marca à mão quais elementos "aparecem" na tela. */
function mount(html: string, visibleIds: string[]) {
  document.body.innerHTML = html
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    const shown = visibleIds.includes(el.id)
    el.getClientRects = () => (shown ? ([{}] as unknown as DOMRectList) : ([] as unknown as DOMRectList))
  }
}

describe("resolveTourSteps", () => {
  it("aponta para o primeiro alvo visível, não para o primeiro do DOM", () => {
    mount(
      `<div id="desktop" data-tour="schedule"></div><div id="mobile" data-tour="schedule"></div>`,
      ["mobile"]
    )
    const [step] = resolveTourSteps([{ element: "[data-tour='schedule']", popover: { title: "Agende" } }])
    expect((step.element as Element).id).toBe("mobile")
  })

  it("aceita lista de seletores e usa o que estiver na tela", () => {
    mount(`<div id="tour-next-session"></div><div id="tour-quiz-cta"></div>`, ["tour-quiz-cta"])
    const [step] = resolveTourSteps([{ element: "#tour-next-session, #tour-quiz-cta", popover: { title: "Próximo passo" } }])
    expect((step.element as Element).id).toBe("tour-quiz-cta")
  })

  it("sem alvo visível (menu escondido no celular), vira popover centralizado com o mesmo texto", () => {
    mount(`<a id="tour-nav-mentors"></a>`, [])
    const [step] = resolveTourSteps([{ element: "#tour-nav-mentors", popover: { title: "Encontre seu mentor" } }])
    expect(step).toEqual({ popover: { title: "Encontre seu mentor" } })
  })

  it("mantém passos sem alvo e passos que já recebem um elemento", () => {
    mount(`<div id="x"></div>`, ["x"])
    const element = document.getElementById("x")!
    const steps = [{ popover: { title: "Bem-vindo" } }, { element, popover: { title: "Já resolvido" } }]
    expect(resolveTourSteps(steps)).toEqual(steps)
  })
})
