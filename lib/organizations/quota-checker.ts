// =================================================================
// QUOTA CHECKER - Multi-Tenant System
// Utility for checking organization quotas
// =================================================================

import { createServiceRoleClient } from "@/utils/supabase/service-role"
import type { QuotaUsage } from "@/types/organizations"

export type QuotaType = "mentors" | "mentees" | "monthly_appointments"

/**
 * Checks if organization has available quota for the specified type
 *
 * @param organizationId - Organization ID
 * @param quotaType - Type of quota to check
 * @returns true if quota is available, false if exceeded
 */
export async function checkQuota(
  organizationId: string,
  quotaType: QuotaType
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.rpc("check_organization_quota", {
    org_id: organizationId,
    quota_type: quotaType
  })

  if (error) {
    console.error("Error checking quota:", error)
    throw new Error(`Failed to check quota: ${error.message}`)
  }

  return data as boolean
}

/**
 * Gets detailed quota usage for an organization
 *
 * @param organizationId - Organization ID
 * @returns Array of quota usage details for all quota types
 */
export async function getQuotaUsage(
  organizationId: string
): Promise<QuotaUsage[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.rpc("get_organization_quota_usage", {
    org_id: organizationId
  })

  if (error) {
    console.error("Error getting quota usage:", error)
    throw new Error(`Failed to get quota usage: ${error.message}`)
  }

  return data as QuotaUsage[]
}

/**
 * Validates quota before performing an action
 * Throws error if quota is exceeded
 *
 * @param organizationId - Organization ID
 * @param quotaType - Type of quota to check
 * @throws Error if quota is exceeded
 */
export async function validateQuota(
  organizationId: string,
  quotaType: QuotaType
): Promise<void> {
  const hasQuota = await checkQuota(organizationId, quotaType)

  if (!hasQuota) {
    const quotaLabels = {
      mentors: "mentors",
      mentees: "mentees",
      monthly_appointments: "monthly appointments"
    }

    throw new Error(
      `Organization has reached the maximum number of ${quotaLabels[quotaType]}. ` +
        `Please upgrade your plan or contact support.`
    )
  }
}

/**
 * Gets quota usage for a specific type
 *
 * @param organizationId - Organization ID
 * @param quotaType - Type of quota
 * @returns Quota usage details
 */
export async function getSpecificQuotaUsage(
  organizationId: string,
  quotaType: QuotaType
): Promise<QuotaUsage | null> {
  const allUsage = await getQuotaUsage(organizationId)
  return allUsage.find((u) => u.quota_type === quotaType) || null
}
