"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { AUDIENCE_LABELS, type AudienceSkipped, type InviteAudience } from "./types"

interface InviteAudienceStepProps {
  audience: InviteAudience
  onAudienceChange: (audience: InviteAudience) => void
  selectedCount: number
  campaign: string
  onCampaignChange: (campaign: string) => void
  resend: boolean
  onResendChange: (resend: boolean) => void
  loadingCount: boolean
  eligibleCount: number | null
  skipped: AudienceSkipped | null
}

/**
 * Passo 1 do modal de convite: escolhe quem recebe a campanha. A
 * contagem de elegíveis vem sempre do servidor (POST /api/admin/invites/audience)
 * — nunca calculada no cliente — para refletir supressões e opt-outs reais.
 */
export function InviteAudienceStep({
  audience,
  onAudienceChange,
  selectedCount,
  campaign,
  onCampaignChange,
  resend,
  onResendChange,
  loadingCount,
  eligibleCount,
  skipped
}: InviteAudienceStepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Público</Label>
        <RadioGroup value={audience} onValueChange={v => onAudienceChange(v as InviteAudience)} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="selected" id="audience-selected" disabled={selectedCount === 0} />
            <Label htmlFor="audience-selected" className="font-normal cursor-pointer">
              {AUDIENCE_LABELS.selected} ({selectedCount})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="jotform_not_invited" id="audience-jotform" />
            <Label htmlFor="audience-jotform" className="font-normal cursor-pointer">{AUDIENCE_LABELS.jotform_not_invited}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never_signed_in" id="audience-never" />
            <Label htmlFor="audience-never" className="font-normal cursor-pointer">{AUDIENCE_LABELS.never_signed_in}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="audience-all" />
            <Label htmlFor="audience-all" className="font-normal cursor-pointer">{AUDIENCE_LABELS.all}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign">Campanha</Label>
        <Input id="campaign" value={campaign} onChange={e => onCampaignChange(e.target.value)} placeholder="estagiorecife-2026" />
        <p className="text-xs text-muted-foreground">Identifica este envio — cada pessoa recebe no máximo um convite por campanha.</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="resend" checked={resend} onCheckedChange={c => onResendChange(Boolean(c))} />
        <Label htmlFor="resend" className="font-normal cursor-pointer">Reenviar para quem já recebeu esta campanha</Label>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        {loadingCount ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando público...
          </div>
        ) : eligibleCount === null ? (
          <p className="text-muted-foreground">Escolha um público para ver quantas pessoas vão receber o e-mail.</p>
        ) : (
          <>
            <p className="font-medium">{eligibleCount} pessoa(s) vão receber este convite.</p>
            {skipped && (skipped.suppressed + skipped.optedOut + skipped.alreadyInvited + skipped.noEmail > 0) && (
              <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                {skipped.alreadyInvited > 0 && <li>{skipped.alreadyInvited} já convidado(s) nesta campanha</li>}
                {skipped.optedOut > 0 && <li>{skipped.optedOut} pediram para não receber mais e-mails</li>}
                {skipped.suppressed > 0 && <li>{skipped.suppressed} pediram exclusão de dados</li>}
                {skipped.noEmail > 0 && <li>{skipped.noEmail} sem e-mail cadastrado</li>}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
