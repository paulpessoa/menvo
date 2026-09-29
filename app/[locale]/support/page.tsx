"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { ShieldAlert, Info, UploadCloud, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

export default function SupportPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    reported_email: "",
    category: "comportamento",
    description: "",
    legal_agreed: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.legal_agreed) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar os termos de responsabilidade para enviar.",
        variant: "destructive"
      })
      return
    }

    if (!formData.description) {
      toast({
        title: "Atenção",
        description: "A descrição é obrigatória.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      let uploadedPaths: string[] = []
      
      // Upload evidence if present
      if (file && user) {
        // Use browser client directly for storage upload
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_evidence.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("reports_evidence")
          .upload(filePath, file)

        if (uploadError) {
          throw new Error("Erro ao enviar anexo de evidência.")
        }
        uploadedPaths.push(filePath)
      }

      // Submit Report
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          description: formData.description,
          reported_email: formData.reported_email,
          evidence_paths: uploadedPaths
        })
      })

      if (!res.ok) throw new Error("Erro ao enviar denúncia.")

      toast({
        title: "Denúncia registrada",
        description: "Sua denúncia foi enviada à moderação e será analisada com sigilo.",
      })
      
      // Reset form
      setFormData({
        reported_email: "",
        category: "comportamento",
        description: "",
        legal_agreed: false
      })
      setFile(null)

    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Central de Confiança e Segurança</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Seu espaço seguro para relatar qualquer comportamento inadequado, ausência ou problemas na plataforma.
      </p>

      <div className="bg-muted/30 border border-border rounded-xl p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="category">Qual o motivo da denúncia?</Label>
            <select 
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="comportamento">Comportamento Inadequado / Assédio</option>
              <option value="no_show">Falta na Mentoria (Ausência injustificada)</option>
              <option value="spam">Spam ou Fraude</option>
              <option value="outro">Outro motivo</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported_email">Nome ou E-mail da pessoa denunciada (Opcional)</Label>
            <Input 
              id="reported_email"
              placeholder="Ex: joao@email.com ou João Silva"
              value={formData.reported_email}
              onChange={(e) => setFormData({...formData, reported_email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição do ocorrido</Label>
            <Textarea 
              id="description"
              placeholder="Descreva com o máximo de detalhes o que aconteceu..."
              className="min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexar Prova / Evidência (Opcional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors">
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Envie prints de tela, áudios ou documentos que comprovem a denúncia.
              </p>
              <Input 
                type="file" 
                className="max-w-[250px]"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900 flex gap-4 items-start">
            <Info className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200 space-y-3">
              <p className="font-semibold">Termo de Isenção e Responsabilidade Legal</p>
              <p>
                A Menvo atua exclusivamente como provedor de aplicação (conforme o Marco Civil da Internet), recebendo e armazenando esta denúncia para análise interna. Não atuamos como juízes, não garantimos a retenção perpétua destes dados, nem assumimos responsabilidade direta por atos praticados por terceiros.
              </p>
              <p>
                Após a apuração, a plataforma reserva-se o direito de tomar medidas administrativas (como advertência ou banimento) com base em critérios próprios. Contudo, <strong>quaisquer questões de responsabilidade civil, penal ou reparação financeira devem ser tratadas pelas partes envolvidas através das autoridades oficiais competentes.</strong>
              </p>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="legal" 
                  checked={formData.legal_agreed}
                  onCheckedChange={(checked) => setFormData({...formData, legal_agreed: checked as boolean})}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="legal"
                    className="text-sm font-medium leading-normal cursor-pointer"
                  >
                    Declaro que as informações acima são verdadeiras. Estou ciente de que a <strong>falsa comunicação de crime, calúnia ou difamação</strong> constitui infração penal prevista na lei brasileira (Art. 138, 139 e 340 do Código Penal).
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando de forma segura...
              </>
            ) : (
              "Registrar Denúncia Oficial"
            )}
          </Button>

        </form>
      </div>
    </div>
  )
}
