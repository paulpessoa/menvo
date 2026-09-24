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
    it("omits personal_life_help when scope is summary", async () => {
      const sharesData = [
        {
          id: "share-1",
          mentor_id: "mentor-1",
          mentee_id: "mentee-1",
          quiz_response_id: "quiz-1",
          scope: "summary",
          created_at: "2026-09-24T12:00:00Z",
          revoked_at: null
        }
      ]

      const menteesData = [
        {
          id: "mentee-1",
          full_name: "Ana Mentorada",
          avatar_url: "https://example.com/avatar.jpg"
        }
      ]

      const quizData = [
        {
          id: "quiz-1",
          current_challenge: "Transição para liderança tech",
          future_vision: "Ser CTO em 3 anos",
          personal_life_help: "Segredo pessoal muito sensível",
          ai_analysis: {
            titulo_personalizado: "Liderança com Propósito",
            resumo_motivador: "Você tem grande clareza.",
            mentores_sugeridos: [],
            conselhos_praticos: ["Foque em delegação"],
            proximos_passos: ["Conversar com mentores"],
            areas_desenvolvimento: ["Liderança"],
            mensagem_final: "Voe alto!"
          }
        }
      ]

      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "diagnostic_shares") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({ data: sharesData, error: null })
            }
          }
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({ data: menteesData, error: null })
            }
          }
          if (table === "quiz_responses") {
            return {
              select: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({ data: quizData, error: null })
            }
          }
          return {}
        })
      } as any

      const results = await service.listSharesForMentor(supabase, "mentor-1")

      expect(results).toHaveLength(1)
      expect(results[0].mentee.fullName).toBe("Ana Mentorada")
      expect(results[0].currentChallenge).toBe("Transição para liderança tech")
      // Privacy invariant: personal_life_help must be NULL for summary scope
      expect(results[0].personalLifeHelp).toBeNull()
      expect(results[0].analysis?.titulo_personalizado).toBe("Liderança com Propósito")
    })
  })
})
