import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { listOrganizationLeads, updateOrganizationLeadStatus } from '@/lib/services/organizations/org-leads.service';
import { z } from 'zod';

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'closed'])
});

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;

  try {
    const leads = await listOrganizationLeads(status);
    return NextResponse.json({ leads }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    const { id, status } = result.data;
    const updated = await updateOrganizationLeadStatus(id, status);

    return NextResponse.json({ lead: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
