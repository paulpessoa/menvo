/**
 * User Verification Types
 */

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'reviewing';

export interface Verification {
  id: string;
  mentor_id: string;
  verification_type: string;
  status: VerificationStatus | string;
  created_at: string;
  mentor_name: string;
  mentor_email: string;
  mentor_title: string;
  mentor_company: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  rejection_reason?: string;
}
