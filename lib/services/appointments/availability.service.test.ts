import { computeAvailableSlots, type AvailabilityDeps } from "./availability.service"

const mockFlags = jest.fn()
const mockGoogleClient = jest.fn()
jest.mock("@/lib/feature-flags-server", () => ({ getFeatureFlags: () => mockFlags() }))
jest.mock("@/lib/google-calendar-db", () => ({ createUserGoogleCalendarClient: (id: string) => mockGoogleClient(id) }))

const MENTOR = "mentor-1"
// Segunda-feira distante: garante `utcDate > now` e um dia da semana conhecido.
const START = new Date("2030-01-07T12:00:00")
const END = new Date("2030-01-07T20:00:00")

function makeDeps(busy: { scheduled_at: string; duration_minutes: number }[] = [], days = [1]): AvailabilityDeps {
  return {
    availability: {
      listByMentor: jest.fn().mockResolvedValue(
        days.map((d) => ({ id: `a${d}`, mentor_id: MENTOR, day_of_week: d, start_time: "09:00:00", end_time: "11:00:00" }))
      ),
    },
    appointments: { listBusyIntervals: jest.fn().mockResolvedValue(busy) },
  }
}

beforeEach(() => {
  mockFlags.mockReset().mockResolvedValue({ google_calendar_sync_flag: false })
  mockGoogleClient.mockReset()
})

describe("computeAvailableSlots", () => {
  it("returns [] without reading appointments when the mentor has no weekly availability", async () => {
    const deps = makeDeps([], [])
    expect(await computeAvailableSlots(deps, MENTOR, START, END)).toEqual([])
    expect(deps.appointments.listBusyIntervals).not.toHaveBeenCalled()
  })

  it("lists the weekly slots and asks the repository for busy intervals in the range", async () => {
    const deps = makeDeps()
    const slots = await computeAvailableSlots(deps, MENTOR, START, END)
    expect(slots.map((s) => s.time)).toEqual(["09:00", "10:00"])
    expect(deps.availability.listByMentor).toHaveBeenCalledWith(MENTOR)
    expect(deps.appointments.listBusyIntervals).toHaveBeenCalledWith(MENTOR, START, END)
  })

  it("hides a slot that overlaps a pending/confirmed appointment", async () => {
    const [first, second] = await computeAvailableSlots(makeDeps(), MENTOR, START, END)
    const busy = [{ scheduled_at: first.datetime, duration_minutes: 60 }]
    const slots = await computeAvailableSlots(makeDeps(busy), MENTOR, START, END)
    expect(slots.map((s) => s.datetime)).toEqual([second.datetime])
  })

  it("keeps the Menvo list when Google Calendar fails (silent fallback)", async () => {
    mockFlags.mockResolvedValue({ google_calendar_sync_flag: true })
    mockGoogleClient.mockRejectedValue(new Error("token expired"))
    jest.spyOn(console, "log").mockImplementation(() => undefined)
    const slots = await computeAvailableSlots(makeDeps(), MENTOR, START, END)
    expect(slots).toHaveLength(2)
    expect(mockGoogleClient).toHaveBeenCalledWith(MENTOR)
  })
})
