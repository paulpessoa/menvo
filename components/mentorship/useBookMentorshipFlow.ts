"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth"
import { useMentorAvailability } from "@/hooks/appointments/useMentorAvailability"
import { getMyPendingCheckinAction } from "@/app/actions/session-checkin"
import type { PendingCheckin } from "@/lib/services/appointments/checkin-responses.service"
import { toTimeSlots } from "./book-mentorship-slots"

const WINDOW_DAYS = 14

/**
 * Loading side of the booking modal: the pending check-in gate, then the
 * availability query for the next 14 days.
 *
 * Why a gate: before booking again the mentee says whether the last session
 * happened (1 click; rating is optional, see docs/domains/session-checkin.md §4),
 * so the availability is only read once the gate answers "nothing pending".
 * `restart` re-runs both (retry button, answered check-in, slot taken).
 */
export function useBookMentorshipFlow(isOpen: boolean, mentorId: string, intlLocale: string) {
  const { user } = useAuth()
  const [pendingCheckin, setPendingCheckin] = useState<PendingCheckin | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  // A fresh window each time the modal opens (or the mentor changes).
  const range = useMemo(
    () => ({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, mentorId]
  )
  const availability = useMentorAvailability(mentorId, { ...range, enabled: isOpen && gateOpen })
  const slots = useMemo(
    () => toTimeSlots(availability.data ?? [], intlLocale),
    [availability.data, intlLocale]
  )

  const restart = async () => {
    setGateOpen(false)
    setPendingCheckin(null)

    if (user?.id) {
      const pending = await getMyPendingCheckinAction()
      if (pending) {
        setPendingCheckin(pending)
        return
      }
    }
    setGateOpen(true)
  }

  useEffect(() => {
    if (isOpen) {
      restart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mentorId])

  const checkingIn = isOpen && !gateOpen && !pendingCheckin
  return {
    slots,
    pendingCheckin,
    loading: checkingIn || availability.isFetching,
    hasError: availability.isError,
    restart
  }
}
