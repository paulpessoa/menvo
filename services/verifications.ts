import { supabase } from '@/services/auth/supabase'
import { Verification } from '@/types/verifications'
import { Database } from '@/types/database'

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

    const { error } = await supabase.rpc("request_mentor_verification", {
      mentor_user_id: user.id,
    })

    if (error) throw error
  }

  // Agendar verificação (admin)
  async scheduleVerification(verificationId: string, scheduledAt: string, adminId: string): Promise<void> {
    const { error } = await supabase.rpc("schedule_mentor_verification", {
      verification_id: verificationId,
      scheduled_datetime: scheduledAt,
      admin_id: adminId,
    })

    if (error) throw error
  }

  async getPendingVerifications(adminId: string): Promise<Verification[]> {
    // Tenta primeiro via RPC
    try {
      const { data, error } = await supabase.rpc("get_pending_verifications", {
        admin_id: adminId,
      })
      if (!error && data) return data as any as Verification[]
    } catch (e) {
      console.warn("RPC get_pending_verifications failed, falling back to manual fetch")
    }

    // Fallback: Fetch pending verifications manualmente
    const { data: verifications, error } = await supabase
      .from('mentor_verification')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      throw new Error(`Error fetching pending verifications: ${error.message}`)
    }

    if (!verifications || verifications.length === 0) {
      return []
    }

    // Fetch mentor info for each verification
    const mentorIds = verifications.map((v: any) => v.mentor_id)
    const { data: mentors, error: mentorsError } = await supabase
      .from('mentors')
      .select(`
        id,
        user_id,
        title,
        company
      `)
      .in('id', mentorIds)

    if (mentorsError) {
      throw new Error(`Error fetching mentors: ${mentorsError.message}`)
    }

    // Fetch profiles for mentors
    const userIds = mentors?.map((m: any) => m.user_id) || []
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email
      `)
      .in('id', userIds)

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }

    // Map mentor and profile info to verifications
    const mentorMap = new Map(mentors?.map((m: any) => [m.id, m]))
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]))

    const result: Verification[] = verifications.map((v: any) => {
      const mentor = mentorMap.get(v.mentor_id) as any
      const profile = mentor ? profileMap.get(mentor.user_id) as any : null
      return {
        id: v.id,
        mentor_id: v.mentor_id,
        verification_type: v.verification_type,
        status: v.status,
        created_at: v.created_at,
        mentor_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        mentor_email: profile ? profile.email : 'Unknown',
        mentor_title: mentor?.title || '',
        mentor_company: mentor?.company || ''
      }
    })

    return result
  }

  async completeVerification(params: CompleteVerificationParams): Promise<void> {
    // Tenta via RPC primeiro
    try {
      const { error } = await supabase.rpc("complete_mentor_verification", {
        verification_id: params.verificationId,
        admin_id: params.adminId,
        verification_passed: params.passed,
        verification_notes: params.notes || null,
      })
      if (!error) return
    } catch (e) {
        console.warn("RPC complete_mentor_verification failed, falling back to manual update")
    }

    const { verificationId, adminId, passed, notes } = params

    const updates = {
      status: passed ? 'completed' : 'rejected',
      completed_at: new Date().toISOString(),
      verified_by: adminId,
      verification_notes: notes || null,
      updated_at: new Date().toISOString()
    }

    const { data: verification, error } = await supabase
      .from('mentor_verification')
      .select('mentor_id')
      .eq('id', verificationId)
      .single()

    if (error || !verification) {
      throw new Error(`Verification not found: ${error?.message || 'No data'}`)
    }

    const { error: updateError } = await supabase
      .from('mentor_verification')
      .update(updates as any)
      .eq('id', verificationId)

    if (updateError) {
      throw new Error(`Error updating verification: ${updateError.message}`)
    }

    if (passed) {
      // Update mentor status to 'verified' and set verified_by and verified_at
      const { error: mentorError } = await supabase
        .from('mentors')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', (verification as any).mentor_id)

      if (mentorError) {
        throw new Error(`Error updating mentor status: ${mentorError.message}` || 'Unknown error')
      }
    }
  }

  // Obter detalhes da verificação
  async getVerificationDetails(verificationId: string) {
    const { data, error } = await supabase
      .from("mentor_verification")
      .select(`
        *,
        mentors (
          *,
          profiles (*)
        )
      `)
      .eq("id", verificationId)
      .single()

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
