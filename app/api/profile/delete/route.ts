import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"

export async function DELETE() {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await deleteUserCompletely(user.id, { source: "self_service" })
    return NextResponse.json({ success: true, filesRemoved: result.filesRemoved })
  } catch (error) {
    console.error("[DELETE_ACCOUNT_API]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
