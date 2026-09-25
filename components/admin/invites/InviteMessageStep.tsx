"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface InviteMessageStepProps {
  subject: string
  onSubjectChange: (subject: string) => void
  body: string
  onBodyChange: (body: string) => void
}

/**
 * Passo 2 do modal de convite: assunto e corpo, editáveis pelo admin.
 * Os botões de ação e o rodapé de LGPD (opt-out/exclusão) são fixos e
 * entram automaticamente — ver lib/email/brevo.ts `buildReengagementInviteHtml`.
 */
export function InviteMessageStep({ subject, onSubjectChange, body, onBodyChange }: InviteMessageStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-subject">Assunto</Label>
        <Input id="invite-subject" value={subject} onChange={e => onSubjectChange(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-body">Mensagem</Label>
        <Textarea
          id="invite-body"
          value={body}
          onChange={e => onBodyChange(e.target.value)}
          rows={14}
          maxLength={10000}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use <code>{"{{primeiro_nome}}"}</code> onde quiser o primeiro nome da pessoa. Uma linha em branco separa
          parágrafos. O botão de acesso, o link "quero ser mentor(a)" e o aviso de LGPD (parar de receber e-mails /
          apagar dados) entram automaticamente abaixo do seu texto e não podem ser removidos aqui.
        </p>
      </div>
    </div>
  )
}
