import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: types, error } = await supabase
      .from("volunteer_activity_types")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching activity types:", error)
      return NextResponse.json({ error: "Failed to fetch activity types" }, { status: 500 })
    }

    return NextResponse.json(types)
  } catch (error) {
    console.error("Error in activity types API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
