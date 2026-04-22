import { createClient } from '@/lib/utils/supabase/client'
import { Verification } from '@/lib/types/models/verification'

class VerificationServiceClass {
  private supabase = createClient()

  async getPendingVerifications(adminId: string): Promise<Verification[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .returns<any>()

    if (error) throw error

    return (data || []).map((profile: any) => ({
      id: profile.id,
      mentor_id: profile.id,
      mentor_name: profile.full_name || `${profile.first_name} ${profile.last_name}`,
      mentor_email: profile.email,
      mentor_title: profile.current_position || 'Mentor',
      mentor_company: profile.current_company || '',
      verification_type: 'Identity',
      status: 'pending',
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }))
  }

  async completeVerification({
    verificationId,
    adminId,
    passed,
    notes
  }: {
    verificationId: string
    adminId: string
    passed: boolean
    notes: string
  }) {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        verification_status: passed ? 'approved' : 'rejected',
        verification_notes: notes,
        verified: passed,
        verified_at: passed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', verificationId)

    if (error) throw error
    return true
  }
}

export const VerificationService = new VerificationServiceClass()
