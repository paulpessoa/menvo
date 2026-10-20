import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InviteMemberCardProps {
  /** Resolve `true` se o convite foi enviado: só então o campo é limpo. */
  onInvite: (email: string) => Promise<boolean>
  pending: boolean
}

/** Convite por e-mail. A pessoa precisa já ter conta; o servidor responde se não tiver. */
export function InviteMemberCard({ onInvite, pending }: InviteMemberCardProps) {
  const [email, setEmail] = useState("")

  const submit = async () => {
    if (!email.trim() || pending) return
    if (await onInvite(email.trim())) setEmail("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Convidar membro
        </CardTitle>
        <CardDescription>
          A pessoa precisa já ter conta na Menvo. Ela recebe um e-mail e aceita no perfil dela.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="pessoa@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>
        <Button onClick={submit} disabled={pending || !email.trim()}>
          {pending ? <Loader2 className="animate-spin h-4 w-4" /> : "Convidar"}
        </Button>
      </CardContent>
    </Card>
  )
}
