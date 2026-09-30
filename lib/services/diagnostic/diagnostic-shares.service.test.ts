import { DiagnosticSharesService } from "./diagnostic-shares.service"

describe("DiagnosticSharesService", () => {
  let service: DiagnosticSharesService

  beforeEach(() => {
    service = new DiagnosticSharesService()
  })

  describe("shareDiagnostic", () => {
    it("creates a new share when none exists", async () => {
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: "share-1",
              mentee_id: "mentee-1",
              mentor_id: "mentor-1",
              quiz_response_id: "quiz-1",
              scope: "summary"
            },
            error: null
          })
        })
      })

      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "diagnostic_shares") {
            return {
              select: selectMock,
              eq: eqMock,
              then: (resolve: any) => resolve({ data: [], error: null }),
              insert: insertMock
            }
          }
          return {}
        })
      } as any

      const result = await service.shareDiagnostic(supabase, "mentee-1", {
        mentor_id: "mentor-1",
        quiz_response_id: "quiz-1",
        scope: "summary"
      })

      expect(result.id).toBe("share-1")
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mentee_id: "mentee-1",
          mentor_id: "mentor-1",
          quiz_response_id: "quiz-1",
          scope: "summary"
        })
      )
    })

    it("reactivates a previously revoked share", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "share-revoked-1",
                mentee_id: "mentee-1",
                mentor_id: "mentor-1",
                quiz_response_id: "quiz-1",
                scope: "full",
                revoked_at: null
              },
              error: null
            })
          })
        })
      })

      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "diagnostic_shares") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      id: "share-revoked-1",
                      revoked_at: "2026-09-01T00:00:00Z"
                    }
                  ],
                  error: null
                }),
              update: updateMock
            }
          }
          return {}
        })
      } as any

      const result = await service.shareDiagnostic(supabase, "mentee-1", {
        mentor_id: "mentor-1",
        quiz_response_id: "quiz-1",
        scope: "full"
      })

      expect(result.id).toBe("share-revoked-1")
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          revoked_at: null,
          scope: "full"
        })
      )
    })
  })

  describe("revokeShare", () => {
    it("sets revoked_at timestamp for the owned share", async () => {
      const eqSecondMock = jest.fn().mockResolvedValue({ error: null })
      const eqFirstMock = jest.fn().mockReturnValue({ eq: eqSecondMock })
      const updateMock = jest.fn().mockReturnValue({ eq: eqFirstMock })

      const supabase = {
        from: jest.fn().mockReturnValue({
          update: updateMock
        })
      } as any

      await service.revokeShare(supabase, "share-123", "mentee-1")

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          revoked_at: expect.any(String)
        })
      )
      expect(eqFirstMock).toHaveBeenCalledWith("id", "share-123")
      expect(eqSecondMock).toHaveBeenCalledWith("mentee_id", "mentee-1")
    })
  })

  describe("listSharesForMentor", () => {
    // The row shape `get_shared_diagnostics_for_mentor` returns. It already
    // has personal_life_help blanked for a 'summary' share, and carries no
    // name/e-mail/LinkedIn at all - see migration 20260930000001.
    const summaryRow = {
      share_id: "share-1",
      quiz_response_id: "quiz-1",
      diagnostic_session_id: null,
      scope: "summary",
      created_at: "2026-09-24T12:00:00Z",
      mentee_id: "mentee-1",
      mentee_full_name: "Ana Mentorada",
      mentee_avatar_url: "https://example.com/avatar.jpg",
      analysis: {
        titulo_personalizado: "Liderança com Propósito",
        resumo_motivador: "Você tem grande clareza.",
        mentores_sugeridos: [],
        conselhos_praticos: ["Foque em delegação"],
        proximos_passos: ["Conversar com mentores"],
        areas_desenvolvimento: ["Liderança"],
        mensagem_final: "Voe alto!"
      },
      development_areas: ["Liderança"],
      current_challenge: "Transição para liderança tech",
      future_vision: "Ser CTO em 3 anos",
      career_moment: "transicao",
      personal_life_help: null
    }

    function makeRpcClient(rows: any[]) {
      return {
        rpc: jest.fn().mockResolvedValue({ data: rows, error: null }),
        // Reading these tables directly is exactly what the RPC replaced;
        // touching them here should fail loudly.
        from: jest.fn(() => {
          throw new Error("mentor reads must go through the RPC")
        })
      } as any
    }

    it("reads through the scope-enforcing RPC, not quiz_responses", async () => {
      const supabase = makeRpcClient([summaryRow])

      const results = await service.listSharesForMentor(supabase, "mentor-1")

      expect(supabase.rpc).toHaveBeenCalledWith("get_shared_diagnostics_for_mentor", {
        p_share_id: null
      })
      expect(supabase.from).not.toHaveBeenCalled()
      expect(results).toHaveLength(1)
      expect(results[0].mentee.fullName).toBe("Ana Mentorada")
      expect(results[0].currentChallenge).toBe("Transição para liderança tech")
      expect(results[0].analysis?.titulo_personalizado).toBe("Liderança com Propósito")
      // Privacy invariant: personal_life_help must be NULL for summary scope
      expect(results[0].personalLifeHelp).toBeNull()
    })

    it("passes through personal_life_help when the share is full", async () => {
      const supabase = makeRpcClient([
        { ...summaryRow, scope: "full", personal_life_help: "Segredo pessoal muito sensível" }
      ])

      const results = await service.listSharesForMentor(supabase, "mentor-1")

      expect(results[0].scope).toBe("full")
      expect(results[0].personalLifeHelp).toBe("Segredo pessoal muito sensível")
    })

    it("never exposes the mentee's name, e-mail or LinkedIn beyond the profile name", async () => {
      const supabase = makeRpcClient([summaryRow])

      const results = await service.listSharesForMentor(supabase, "mentor-1")

      const serialized = JSON.stringify(results[0])
      expect(serialized).not.toContain("@")
      expect(serialized).not.toContain("linkedin")
    })
  })

  describe("getSharedDiagnosticForMentor", () => {
    it("asks the RPC for that one share", async () => {
      const supabase = {
        rpc: jest.fn().mockResolvedValue({
          data: [
            {
              share_id: "share-9",
              quiz_response_id: "quiz-9",
              diagnostic_session_id: null,
              scope: "summary",
              created_at: "2026-09-24T12:00:00Z",
              mentee_id: "mentee-9",
              mentee_full_name: "Ana",
              mentee_avatar_url: null,
              analysis: null,
              development_areas: null,
              current_challenge: null,
              future_vision: null,
              career_moment: null,
              personal_life_help: null
            }
          ],
          error: null
        })
      } as any

      const result = await service.getSharedDiagnosticForMentor(supabase, "mentor-1", "share-9")

      expect(supabase.rpc).toHaveBeenCalledWith("get_shared_diagnostics_for_mentor", {
        p_share_id: "share-9"
      })
      expect(result?.shareId).toBe("share-9")
      expect(result?.developmentAreas).toEqual([])
    })

    it("returns null for a share that is revoked or belongs to another mentor", async () => {
      const supabase = {
        rpc: jest.fn().mockResolvedValue({ data: [], error: null })
      } as any

      const result = await service.getSharedDiagnosticForMentor(supabase, "mentor-1", "share-x")

      expect(result).toBeNull()
    })
  })
})
