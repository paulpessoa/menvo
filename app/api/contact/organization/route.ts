import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { organizationLeadSchema } from '@/lib/schemas/organization-lead';
import { createOrganizationLead } from '@/lib/services/organizations/org-leads.service';
import { sendAdminNewOrganizationLead } from '@/lib/email/brevo';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`org-lead:${ip}`, { maxRequests: 5, windowMs: 10 * 60_000 });
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 2. Parse payload
    const body = await request.json();
    const result = organizationLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const data = result.data;

    // 3. Honeypot check
    if (data.website && data.website.trim() !== '') {
      // Act like it succeeded to confuse bots
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    // 4. Create Lead
    const lead = await createOrganizationLead(data);

    // 5. Send notification to admin (non-blocking)
    try {
      await sendAdminNewOrganizationLead({
        org_name: lead.org_name,
        org_type: lead.org_type,
        contact_name: lead.contact_name,
        contact_email: lead.contact_email,
        contact_phone: lead.contact_phone,
        people_estimate: lead.people_estimate,
        message: lead.message,
        locale: lead.locale
      });
    } catch (emailError: any) {
      console.error('❌ [ORG LEAD API] Erro ao enviar notificação de novo lead:', emailError);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    console.error('❌ [ORG LEAD API] Erro inesperado:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
