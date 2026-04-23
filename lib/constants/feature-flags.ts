
import type { Database } from "@/lib/types/supabase"

// Tipagem baseada no Banco de Dados para uso interno
export type FeatureFlagRow = Database['public']['Tables']['feature_flags']['Row'];

export const FEATURE_FLAGS_TABLE = 'feature_flags';
export const FEATURE_FLAGS_AUDIT_LOGS_TABLE = 'feature_flag_audit_logs';

export interface FeatureFlags {
    waitingListEnabled: boolean
    feedbackEnabled: boolean
    maintenanceMode: boolean
    newUserRegistration: boolean
    mentorVerification: boolean
    NEW_MENTORSHIP_UX: boolean
    [key: string]: boolean | undefined
}

// Fallbacks seguros (Hardcoded e Env Vars)
// Centralizado aqui para ser usado tanto na API quanto no Contexto Cliente
export const DEFAULT_FLAGS: FeatureFlags = {
    waitingListEnabled: process.env.NEXT_PUBLIC_FEATURE_WAITING_LIST === "true",
    feedbackEnabled: process.env.NEXT_PUBLIC_FEATURE_FEEDBACK !== "false",
    maintenanceMode: process.env.NEXT_PUBLIC_FEATURE_MAINTENANCE_MODE === "true",
    newUserRegistration: process.env.NEXT_PUBLIC_FEATURE_NEW_USER_REGISTRATION !== "false",
    mentorVerification: process.env.NEXT_PUBLIC_FEATURE_MENTOR_VERIFICATION !== "false",
    NEW_MENTORSHIP_UX: process.env.NEXT_PUBLIC_FEATURE_NEW_UX === "true"
};
