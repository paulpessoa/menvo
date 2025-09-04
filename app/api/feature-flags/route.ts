import { NextResponse } from "next/server"

// Default feature flags (fallbacks)
const DEFAULT_FLAGS = {
  waitingListEnabled: false,
  feedbackEnabled: true,
  maintenanceMode: false,
  newUserRegistration: true,
  mentorVerification: true,
}

export async function GET() {
  try {
    // Use environment variables for feature flags
    // These can be easily configured in Vercel dashboard
    const flags = {
      waitingListEnabled: process.env.NEXT_PUBLIC_FEATURE_WAITING_LIST === "true",
      feedbackEnabled: process.env.NEXT_PUBLIC_FEATURE_FEEDBACK !== "false", // default true
      maintenanceMode: process.env.NEXT_PUBLIC_FEATURE_MAINTENANCE_MODE === "true",
      newUserRegistration: process.env.NEXT_PUBLIC_FEATURE_NEW_USER_REGISTRATION !== "false", // default true
      mentorVerification: process.env.NEXT_PUBLIC_FEATURE_MENTOR_VERIFICATION !== "false", // default true
    }

    // Merge with defaults to ensure all flags exist
    const mergedFlags = { ...DEFAULT_FLAGS, ...flags }

    return NextResponse.json({
      flags: mergedFlags,
      source: "environment-variables",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching feature flags:", error)
    
    // Return default flags on any error
    return NextResponse.json({
      flags: DEFAULT_FLAGS,
      source: "default",
      error: "Failed to fetch feature flags",
      timestamp: new Date().toISOString(),
    })
  }
}