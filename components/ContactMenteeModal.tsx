"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/routing"

interface ContactMenteeModalProps {
  menteeId: string
  menteeName: string
  contactLabel?: string
  children: React.ReactNode
  isLoggedIn: boolean
}

export function ContactMenteeModal({ menteeId, menteeName, contactLabel = "Oferecer Ajuda", children, isLoggedIn }: ContactMenteeModalProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isLoggedIn) {
      toast.info("Faça login para enviar uma mensagem")
      router.push("/login")
      return
    }
    setOpen(newOpen)
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escreva uma mensagem.")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/community/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menteeId, message: message.trim() })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao enviar mensagem")
      }

      toast.success("Mensagem enviada com sucesso! O mentorado receberá seu perfil por e-mail.")
      setOpen(false)
      setMessage("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/50">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl md:text-2xl font-black text-center text-foreground">
            Oferecer Ajuda
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium text-sm md:text-base px-2 leading-relaxed">
            Escreva uma mensagem para iniciar a conversa com <strong>{menteeName}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Textarea
            placeholder="Ex: Olá! Vi seu perfil e acredito que posso te ajudar com a área de..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none rounded-xl border-border/60 focus:border-primary shadow-sm"
          />
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50 text-center">
            Ao enviar, o seu perfil completo da Menvo também será enviado junto para que o mentorado conheça sua trajetória. Uma cópia será enviada para o seu próprio e-mail.
          </p>
        </div>

        <DialogFooter className="sm:justify-stretch">
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="rounded-xl w-full font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
