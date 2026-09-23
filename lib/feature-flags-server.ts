import { createClient } from "@supabase/supabase-js"

export interface FeatureFlags {
  waiting_list_flag: boolean
  feedback_app_flag: boolean
  maintenance_mode_flag: boolean
  ai_assistant_flag: boolean
  /**
   * In-app chat (header "Mensagens", /messages, chat buttons). Off by default:
   * for now mentors and mentees talk on LinkedIn, which pushes the exchange
   * outside the platform. Turn on when users start asking for a built-in channel.
   */
  chat_flag: boolean
}

export const DEFAULT_FLAGS: FeatureFlags = {
  waiting_list_flag: false,
  feedback_app_flag: false,
  maintenance_mode_flag: false,
  ai_assistant_flag: false,
  chat_flag: false
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data } = await supabase
      .from("feature_flags")
      .select("name, enabled")

    const flagsFromDB: any = {}
    data?.forEach(f => {
      flagsFromDB[f.name] = f.enabled
    })

    return { ...DEFAULT_FLAGS, ...flagsFromDB }
  } catch {
    return DEFAULT_FLAGS
  }
}
