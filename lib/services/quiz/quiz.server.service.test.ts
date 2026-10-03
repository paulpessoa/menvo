/**
 * @jest-environment node
 */
import { signResultLink } from "@/lib/quiz/result-link"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"
import type { QuizRepository } from "@/lib/repositories/quiz.repository"
import type { AccountProvisioner } from "@/lib/ports/account-provisioner"
import { createQuizService, type QuizServiceDeps } from "./quiz.server.service"

const ID = "33333333-3333-3333-3333-333333333333"

const analysis: QuizAnalysis = {
  titulo_personalizado: "Rumo a dados",
  resumo_motivador: "Você está no caminho.",
  mentores_sugeridos: [],
  conselhos_praticos: [],
  proximos_passos: [],
  areas_desenvolvimento: [],
  mensagem_final: "Boa sorte!",
}

const input = {
  name: "Ana Silva",
  email: "Ana@Example.com",
  linkedin_url: "",
  career_moment: "estudante",
  mentorship_experience: "nao-sei",
  development_areas: ["dados"],
  current_challenge: "Preciso do primeiro estágio.",
  future_vision: "Quero ser desenvolvedora.",
  share_knowledge: "sim",
  personal_life_help: "Equilibrar estudo e trabalho.",
}

function fakeRepo(overrides: Partial<QuizRepository> = {}): jest.Mocked<QuizRepository> {
  return {
    submissionStatus: jest.fn().mockResolvedValue("ok"),
    insert: jest.fn().mockResolvedValue(undefined),
    findLatestByEmail: jest.fn().mockResolvedValue(null),
    getResult: jest.fn().mockResolvedValue(null),
    ownsQuiz: jest.fn().mockResolvedValue(false),
    claimAnalysis: jest.fn().mockResolvedValue({ claimed: false }),
    saveAnalysis: jest.fn().mockResolvedValue(undefined),
    findForEmail: jest.fn().mockResolvedValue(null),
    markEmailSent: jest.fn().mockResolvedValue(undefined),
    findForAccount: jest.fn().mockResolvedValue(null),
    linkUser: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<QuizRepository>
}

function setup(over: { repo?: Partial<QuizRepository>; admin?: Partial<QuizRepository>; deps?: Partial<QuizServiceDeps> } = {}) {
  const repo = fakeRepo(over.repo)
  const admin = fakeRepo(over.admin)
  const accounts: jest.Mocked<AccountProvisioner> = {
    emailHasAccount: jest.fn().mockResolvedValue(false),
    createConfirmedAccount: jest.fn().mockResolvedValue({ kind: "created", userId: "user-1" }),
  }
  const order: string[] = []
  const deps: QuizServiceDeps = {
    repo,
    adminRepo: () => admin,
    mentors: { list: jest.fn().mockImplementation(async () => (order.push("mentors"), [])) },
    accounts,
    mailer: { send: jest.fn().mockImplementation(async () => (order.push("email"), { success: true })) },
    analyze: jest.fn().mockImplementation(async () => (order.push("analyze"), { analysis })),
    recordCalls: jest.fn().mockImplementation(async () => void order.push("record")),
    ...over.deps,
  }
  repo.claimAnalysis.mockImplementation(async () => {
    order.push("claim")
    return { claimed: true, answers: { name: "Ana" } as never }
  })
  repo.saveAnalysis.mockImplementation(async () => void order.push("save"))
  return { service: createQuizService(deps), repo, admin, accounts, deps, order }
}

// Lido na hora de assinar o token, e `describe` assina antes de qualquer hook.
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key"
beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("submit", () => {
  it("uses the session e-mail (lower-cased), not the form one, and links the user", async () => {
    const { service, repo } = setup()
    const result = await service.submit({ input, ip: "1.1.1.1", user: { id: "u1", email: "Account@Example.com" } })

    expect(result.kind).toBe("created")
    expect(repo.submissionStatus).toHaveBeenCalledWith({ email: "account@example.com", ip: "1.1.1.1", isAuth: true })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", email: "account@example.com", ip_address: "1.1.1.1" }))
  })

  it("anonymous: lower-cases the form e-mail and leaves user_id null", async () => {
    const { service, repo } = setup()
    await service.submit({ input, ip: "1.1.1.1", user: null })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: null, email: "ana@example.com", linkedin_url: null }))
  })

  it.each([
    ["email_limit", true, 2],
    ["ip_limit", false, 1],
  ] as const)("%s blocks before inserting (limit %i for logged=%s)", async (code, logged, count) => {
    const { service, repo } = setup({ repo: { submissionStatus: jest.fn().mockResolvedValue(code) } })
    const result = await service.submit({ input, ip: "i", user: logged ? { id: "u1", email: "a@b.co" } : null })
    expect(result).toEqual({ kind: "limit", code, limitCount: logged ? 2 : count })
    expect(repo.insert).not.toHaveBeenCalled()
  })

  it("budget blocks before inserting", async () => {
    const { service, repo } = setup({ repo: { submissionStatus: jest.fn().mockResolvedValue("budget") } })
    expect(await service.submit({ input, ip: "i", user: null })).toEqual({ kind: "budget" })
    expect(repo.insert).not.toHaveBeenCalled()
  })

  it("reports failure when the insert throws", async () => {
    const { service } = setup({ repo: { insert: jest.fn().mockRejectedValue(new Error("db")) } })
    expect(await service.submit({ input, ip: "i", user: null })).toEqual({ kind: "failed" })
  })
})

describe("getResult", () => {
  const row = { id: ID, processed_at: null, ai_analysis: analysis }

  it("returns null when the quiz does not exist", async () => {
    const { service } = setup()
    expect(await service.getResult(ID, true)).toBeNull()
  })

  it("only asks about ownership when a session exists", async () => {
    const { service, repo } = setup({ repo: { getResult: jest.fn().mockResolvedValue(row), ownsQuiz: jest.fn().mockResolvedValue(true) } })
    expect((await service.getResult(ID, false))?.is_owner).toBe(false)
    expect(repo.ownsQuiz).not.toHaveBeenCalled()
    expect((await service.getResult(ID, true))?.is_owner).toBe(true)
  })
})

describe("runAnalysis", () => {
  const args = { id: ID, serverKey: "k", isAuthenticated: true }

  it("claim failure is reported and nothing else runs", async () => {
    const s = setup()
    s.repo.claimAnalysis.mockRejectedValue(new Error("rpc"))
    expect(await s.service.runAnalysis(args)).toEqual({ kind: "claim_failed" })
    expect(s.deps.analyze).not.toHaveBeenCalled()
  })

  it("not claimed: no mentors, no AI, no e-mail", async () => {
    const s = setup()
    s.repo.claimAnalysis.mockResolvedValue({ claimed: false })
    expect(await s.service.runAnalysis(args)).toEqual({ kind: "not_claimed" })
    expect(s.deps.analyze).not.toHaveBeenCalled()
    expect(s.deps.mailer.send).not.toHaveBeenCalled()
  })

  it("keeps the order claim -> mentors -> analyze -> save -> record -> email", async () => {
    const s = setup({ admin: { findForEmail: jest.fn().mockResolvedValue({ id: ID, name: "Ana", email: "a@b.co", user_id: null, ai_analysis: analysis }) } })
    expect(await s.service.runAnalysis(args)).toEqual({ kind: "done" })
    expect(s.order).toEqual(["claim", "mentors", "analyze", "save", "record", "email"])
    expect(s.repo.saveAnalysis).toHaveBeenCalledWith("k", ID, analysis)
  })

  it("a failed save still records AI usage but sends no e-mail", async () => {
    const s = setup()
    s.repo.saveAnalysis.mockRejectedValue(new Error("save"))
    expect(await s.service.runAnalysis(args)).toEqual({ kind: "done" })
    expect(s.deps.recordCalls).toHaveBeenCalled()
    expect(s.deps.mailer.send).not.toHaveBeenCalled()
  })

  it("an e-mail failure never breaks the analysis", async () => {
    const s = setup({ admin: { findForEmail: jest.fn().mockRejectedValue(new Error("no service key")) } })
    await expect(s.service.runAnalysis(args)).resolves.toEqual({ kind: "done" })
  })
})

describe("sendResults", () => {
  const row = { id: ID, name: "Ana", email: "a@b.co", user_id: null, ai_analysis: analysis }

  it("not_found when the row is missing", async () => {
    expect(await setup().service.sendResults(ID)).toBe("not_found")
  })

  it.each([
    ["no analysis yet", null],
    ["a retake nudge", { ...analysis, precisa_refazer: true }],
  ])("not_ready for %s", async (_label, ai_analysis) => {
    const s = setup({ admin: { findForEmail: jest.fn().mockResolvedValue({ ...row, ai_analysis }) } })
    expect(await s.service.sendResults(ID)).toBe("not_ready")
    expect(s.deps.mailer.send).not.toHaveBeenCalled()
  })

  it("failed when the mailer fails, without marking the e-mail as sent", async () => {
    const s = setup({
      admin: { findForEmail: jest.fn().mockResolvedValue(row) },
      deps: { mailer: { send: jest.fn().mockResolvedValue({ success: false, error: "x" }) } },
    })
    expect(await s.service.sendResults(ID)).toBe("failed")
    expect(s.admin.markEmailSent).not.toHaveBeenCalled()
  })

  it("sent: goes to the row's address with a signed link, then marks it sent", async () => {
    const s = setup({ admin: { findForEmail: jest.fn().mockResolvedValue(row) } })
    expect(await s.service.sendResults(ID)).toBe("sent")
    expect(s.deps.mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.co", title: "Rumo a dados", isAuthenticated: false, resultUrl: expect.stringContaining(`/quiz/results/${ID}?k=`) })
    )
    expect(s.admin.markEmailSent).toHaveBeenCalledWith(ID)
  })
})

describe("account from results", () => {
  const row = { id: ID, name: "Ana Silva", email: "a@b.co", user_id: null }
  const token = signResultLink(ID, "a@b.co")

  it("rejects a bad token or a missing row", async () => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue(row) } })
    expect(await s.service.checkAccountLink(ID, "bad.token")).toBeNull()
    expect(await s.service.createAccountFromResults(ID, "bad.token", "123456")).toEqual({ kind: "invalid_link" })
    expect(await setup().service.checkAccountLink(ID, token)).toBeNull()
  })

  it("a token signed for another e-mail does not open this row", async () => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue(row) } })
    expect(await s.service.checkAccountLink(ID, signResultLink(ID, "other@b.co"))).toBeNull()
  })

  it("checkAccountLink: claimable, or exists when the row or the e-mail already has an account", async () => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue(row) } })
    expect(await s.service.checkAccountLink(ID, token)).toEqual({ status: "claimable", email: "a@b.co" })
    s.accounts.emailHasAccount.mockResolvedValue(true)
    expect(await s.service.checkAccountLink(ID, token)).toEqual({ status: "exists", email: "a@b.co" })
    const linked = setup({ admin: { findForAccount: jest.fn().mockResolvedValue({ ...row, user_id: "u9" }) } })
    expect(await linked.service.checkAccountLink(ID, token)).toEqual({ status: "exists", email: "a@b.co" })
  })

  it("creates nothing when the account already exists", async () => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue({ ...row, user_id: "u9" }) } })
    expect(await s.service.createAccountFromResults(ID, token, "123456")).toEqual({ kind: "exists", email: "a@b.co" })
    expect(s.accounts.createConfirmedAccount).not.toHaveBeenCalled()
  })

  it.each([
    [{ kind: "exists" }, { kind: "exists", email: "a@b.co" }],
    [{ kind: "password_rejected", message: "fraca" }, { kind: "password_rejected", message: "fraca" }],
    [{ kind: "failed", message: "x" }, { kind: "failed" }],
  ])("maps the provisioner result %j", async (provisioned, expected) => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue(row) } })
    s.accounts.createConfirmedAccount.mockResolvedValue(provisioned as never)
    expect(await s.service.createAccountFromResults(ID, token, "123456")).toEqual(expected)
    expect(s.admin.linkUser).not.toHaveBeenCalled()
  })

  it("created: links the quiz to the new user", async () => {
    const s = setup({ admin: { findForAccount: jest.fn().mockResolvedValue(row) } })
    expect(await s.service.createAccountFromResults(ID, token, "123456")).toEqual({ kind: "created", email: "a@b.co" })
    expect(s.accounts.createConfirmedAccount).toHaveBeenCalledWith({ email: "a@b.co", password: "123456", fullName: "Ana Silva" })
    expect(s.admin.linkUser).toHaveBeenCalledWith(ID, "user-1")
  })
})
