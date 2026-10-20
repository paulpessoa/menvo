import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMyNotificationsService } from "@/lib/services/me/my-notifications.composition"

/**
 * GET /api/me/notifications?role=mentor|mentee - in-app notifications
 * derived from the caller's own appointments and reviews. Replaces
 * `notificationsService.getUserNotifications`, which queried `appointments`
 * straight from the browser with a client-supplied `userId`
 * (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * `userId` is always the session's own id; `role` is only a hint that picks
 * which notification categories to compute (a wrong value just omits/adds a
 * category, since every query is still scoped to `auth.uid()`), so it is
 * passed through as is and not validated: an unknown value ("admin", which the
 * app does send) must keep producing no notifications. The rules live in
 * lib/domain/profile/notification.entity.ts. Thin: auth, service, status.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const role = request.nextUrl.searchParams.get("role")
  const notifications = await buildMyNotificationsService(supabase).list(user.id, role)

  return NextResponse.json({ notifications })
}
