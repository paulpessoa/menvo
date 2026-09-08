"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/lib/auth/auth-context"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Mail,
  Smartphone,
  Monitor,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  UserCheck,
  Star,
  CalendarX,
  Bell,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react"

interface EmailTemplateMeta {
  key: string
  label: string
  signature: "personal" | "none"
  icon: any
  description: string
}

const TEMPLATES: EmailTemplateMeta[] = [
  {
    key: "confirmation",
    label: "Sessão Confirmada",
    signature: "personal",
    icon: CheckCircle,
    description: "Disparado após confirmação do agendamento, com link do Meet e calendário."
  },
  {
    key: "verification",
    label: "Mentor Aprovado",
    signature: "personal",
    icon: UserCheck,
    description: "Boas-vindas ao mentor após validação do perfil pela moderação."
  },
  {
    key: "feedback",
    label: "Pedido de Avaliação",
    signature: "personal",
    icon: Star,
    description: "Enviado ao mentorado logo após o término da mentoria solicitando depoimento."
  },
  {
    key: "cancellation",
    label: "Mentoria Cancelada",
    signature: "none",
    icon: CalendarX,
    description: "Notifica a contraparte com quem cancelou, motivo informado e horários alternativos."
  },
  {
    key: "reminder",
    label: "Lembrete do Dia",
    signature: "none",
    icon: Bell,
    description: "Lembrete com horário e link da sessão na manhã do dia do agendamento."
  }
]

export default function AdminEmailPreviewPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<string>("confirmation")
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop")

  // Estados de envio de teste real
  const [testEmail, setTestEmail] = useState<string>("")
  const [isSending, setIsSending] = useState<boolean>(false)
  const [sendFeedback, setSendFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Pré-preenche com o e-mail do usuário logado se disponível
  useEffect(() => {
    if (user?.email && !testEmail) {
      setTestEmail(user.email)
    }
  }, [user?.email])

  const currentTemplate = TEMPLATES.find((t) => t.key === selectedTemplate) || TEMPLATES[0]
  const previewUrl = `/api/admin/emails/preview?template=${selectedTemplate}`

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Informe um e-mail válido para receber o teste.")
      return
    }

    setIsSending(true)
    setSendFeedback(null)

    try {
      const res = await fetch("/api/admin/emails/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail.trim(),
          template: selectedTemplate
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao disparar e-mail de teste.")
      }

      toast.success(`E-mail de teste (${currentTemplate.label}) enviado com sucesso!`)
      setSendFeedback({
        type: "success",
        message: `E-mail enviado para ${testEmail.trim()}. Verifique sua caixa de entrada e spam.`
      })
    } catch (err: any) {
      const errorMsg = err.message || "Falha ao conectar com o serviço Brevo."
      toast.error(errorMsg)
      setSendFeedback({
        type: "error",
        message: errorMsg
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8 text-primary" /> Preview de E-mails Transacionais
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Brevo SMTP
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Visualização ao vivo dos templates de e-mail, assinaturas personalizadas e paleta Deep Teal (#007585).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open(previewUrl, "_blank")}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" /> Abrir em Nova Aba
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Template Selector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Modelos de E-mail</CardTitle>
              <CardDescription className="text-xs">
                Selecione um template para carregar a prévia visual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {TEMPLATES.map((item) => {
                const Icon = item.icon
                const isSelected = selectedTemplate === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSelectedTemplate(item.key)
                      setSendFeedback(null)
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                        : "bg-card hover:bg-muted/50 border-muted"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-sm truncate text-foreground">
                          {item.label}
                        </span>
                        {item.signature === "personal" ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                            Paul Pessoa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-slate-50 text-slate-600 border-slate-200">
                            Direto
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Painel de Disparo de Teste Real */}
          <Card className="border-primary/30 shadow-sm bg-gradient-to-b from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Send className="h-4 w-4 text-primary" /> Disparar Teste Real
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-background text-primary border-primary/30">
                  Brevo Live
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Envie o template <strong>{currentTemplate.label}</strong> para uma caixa de entrada real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="test-email" className="font-medium text-foreground">
                    E-mail de destino
                  </label>
                  {user?.email && testEmail !== user.email && (
                    <button
                      type="button"
                      onClick={() => setTestEmail(user.email || "")}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Usar meu e-mail
                    </button>
                  )}
                </div>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={isSending}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                onClick={handleSendTest}
                disabled={isSending || !testEmail.trim()}
                className="w-full gap-2 h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Disparando via Brevo...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Enviar E-mail de Teste
                  </>
                )}
              </Button>

              {sendFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                    sendFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  }`}
                >
                  {sendFeedback.type === "success" ? (
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span className="leading-tight">{sendFeedback.message}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Details Box */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 pt-0">
              {currentTemplate.signature === "personal" ? (
                <div>
                  <p className="font-medium text-foreground mb-1">
                    👤 Assinatura Pessoal do Idealizador
                  </p>
                  <p>
                    Inclui a foto circular de Paul Pessoa, identificação como idealizador, ícone com link direto de WhatsApp e links para LinkedIn e GitHub.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground mb-1">
                    ⚡ Sem Assinatura Redundante
                  </p>
                  <p>
                    Comunicação operacional e direta ao ponto, terminando imediatamente no conteúdo e aproveitando o rodapé institucional do Menvo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Frame */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Viewport Switcher Controls */}
          <div className="flex items-center justify-between w-full mb-4 bg-card border rounded-xl p-2 px-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Visualização:
              </span>
              <div className="flex items-center bg-muted/60 p-1 rounded-lg">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    deviceView === "desktop"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop (580px)
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    deviceView === "mobile"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile (390px)
                </button>
              </div>
            </div>

            <span className="text-xs text-muted-foreground hidden sm:inline">
              Cores: <strong>#007585</strong> (Deep Teal)
            </span>
          </div>

          {/* Device Frame Simulator */}
          <div
            className={`transition-all duration-300 w-full flex justify-center ${
              deviceView === "mobile" ? "max-w-[420px]" : "max-w-full"
            }`}
          >
            <div
              className={`w-full bg-slate-900 rounded-2xl shadow-xl overflow-hidden border-4 border-slate-800 ${
                deviceView === "mobile" ? "p-3 pt-6 rounded-[40px] shadow-2xl" : "p-2"
              }`}
            >
              {/* Mobile Speaker / Notch Bar */}
              {deviceView === "mobile" && (
                <div className="w-24 h-4 bg-slate-800 mx-auto rounded-full mb-3 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-700 rounded-full" />
                </div>
              )}

              {/* Iframe Viewport */}
              <iframe
                key={`${selectedTemplate}-${deviceView}`}
                src={previewUrl}
                title="Preview do E-mail"
                className={`w-full bg-white rounded-lg transition-all duration-300 ${
                  deviceView === "mobile" ? "h-[640px]" : "h-[740px]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
