import { supabase } from '@/lib/services/auth/auth.service'
import { Verification } from '@/lib/types/models/verification'
import { Database } from '@/lib/types/database'

interface CompleteVerificationParams {
  verificationId: string
  adminId: string
  passed: boolean
  notes?: string
}

export class VerificationServiceClass {
  // Solicitar verificação (mentor)
  async requestVerification(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await (supabase.rpc("request_mentor_verification" as any, {
      mentor_user_id: user.id,
    }) as any)

    if (error) throw error
  }

  // Agendar verificação (admin)
  async scheduleVerification(verificationId: string, scheduledAt: string, adminId: string): Promise<void> {
    const { error } = await (supabase.rpc("schedule_mentor_verification" as any, {
      verification_id: parseInt(verificationId),
      scheduled_datetime: scheduledAt,
      admin_id: adminId,
    }) as any)

    if (error) throw error
  }

  async getPendingVerifications(adminId: string): Promise<Verification[]> {
    // Tenta primeiro via RPC
    try {
      const { data, error } = await (supabase.rpc("get_pending_verifications" as any, {
        admin_id: adminId,
      }) as any)
      if (!error && data) return data as any as Verification[]
    } catch (e) {
      console.warn("RPC get_pending_verifications failed, falling back to manual fetch")
    }

    // Fallback: Fetch pending verifications manualmente
    const { data: verificationsRaw, error } = await (supabase
      .from('mentor_verification')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
      .limit(50) as any)

    if (error) {
      throw new Error(`Error fetching pending verifications: ${error.message}`)
    }

    const verifications = (verificationsRaw as any[]) || []

    if (verifications.length === 0) {
      return []
    }

    // Fetch mentor info (from profiles) for each verification
    const mentorIds = verifications.map((v: any) => v.mentor_id)
    const { data: profilesRaw, error: profilesError } = await (supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        job_title,
        company
      `)
      .in('id', mentorIds) as any)

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }

    const profiles = (profilesRaw as any[]) || []
    const profileMap = new Map(profiles.map((p: any) => [p.id, p]))

    const result: Verification[] = verifications.map((v: any) => {
      const profile = profileMap.get(v.mentor_id) as any
      return {
        id: v.id.toString(),
        mentor_id: v.mentor_id,
        verification_type: 'manual', // Default for this simplified schema
        status: v.status,
        created_at: v.submitted_at || v.created_at,
        mentor_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        mentor_email: profile ? profile.email : 'Unknown',
        mentor_title: profile?.job_title || '',
        mentor_company: profile?.company || ''
      }
    })

    return result
  }

  async completeVerification(params: CompleteVerificationParams): Promise<void> {
    // Tenta via RPC primeiro
    try {
      const { error } = await (supabase.rpc("complete_mentor_verification" as any, {
        verification_id: parseInt(params.verificationId),
        admin_id: params.adminId,
        verification_passed: params.passed,
        verification_notes: params.notes || null,
      }) as any)
      if (!error) return
    } catch (e) {
        console.warn("RPC complete_mentor_verification failed, falling back to manual update")
    }

    const { verificationId, adminId, passed, notes } = params
    const numericId = parseInt(verificationId)

    const updates = {
      status: passed ? 'completed' : 'rejected',
      completed_at: new Date().toISOString(),
      verified_by: adminId,
      verification_notes: notes || null,
      updated_at: new Date().toISOString()
    }

    const { data: verification, error } = await (supabase
      .from('mentor_verification')
      .select('mentor_id')
      .eq('id', numericId)
      .single() as any)

    if (error || !verification) {
      throw new Error(`Verification not found: ${error?.message || 'No data'}`)
    }

    const { error: updateError } = await (supabase
      .from('mentor_verification')
      .update(updates as any)
      .eq('id', numericId) as any)

    if (updateError) {
      throw new Error(`Error updating verification: ${updateError.message}`)
    }

    if (passed) {
      // Update mentor status to 'verified' in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          verified: true,
          verification_status: 'approved',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', (verification as any).mentor_id)

      if (profileError) {
        throw new Error(`Error updating profile status: ${profileError.message}`)
      }
    }
  }

  // Obter detalhes da verificação
  async getVerificationDetails(verificationId: string) {
    const { data, error } = await (supabase
      .from("mentor_verification")
      .select(`
        *,
        mentor:profiles!mentor_id(*)
      `)
      .eq("id", parseInt(verificationId))
      .single() as any)

    if (error) throw error
    return data
  }

  // Obter histórico de verificações de um mentor
  async getMentorVerificationHistory(mentorId: string) {
    const { data, error } = await supabase
      .from("mentor_verification")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const VerificationService = new VerificationServiceClass()
