"use client"

import { useRef } from "react"
import { Eye, FileText, GraduationCap, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSimplePDFUpload } from "@/hooks/useSimpleUpload"
import { ChipInput } from "./ChipInput"
import { Field } from "./ProfileAboutSection"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileCareerSectionProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
}

/**
 * "Carreira e Interesses" tab: work, links, education, skills and goals.
 * Merges the old "Carreira" and "Interesses" tabs. Mentors see their
 * expertise first; mentees see what they want to learn first.
 */
export function ProfileCareerSection({ form, onChange, isMentor }: ProfileCareerSectionProps) {
  const cvInputRef = useRef<HTMLInputElement>(null)
  const cvUpload = useSimplePDFUpload("/api/upload/cv")

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = await cvUpload.upload(file)
    if (result.success) {
      onChange({ cv_url: result.data.url })
      toast.success("Currículo atualizado!")
    }
  }

  const expertise = (
    <div className="space-y-2" key="expertise">
      <Label>{isMentor ? "Especialidades (onde você pode ajudar)" : "O que você já domina"}</Label>
      <ChipInput value={form.expertise_areas} onChange={(v) => onChange({ expertise_areas: v })} placeholder="Ex: UX Design, React, Vendas... (Enter para adicionar)" />
    </div>
  )
  const topics = (
    <div className="space-y-2" key="topics">
      <Label>{isMentor ? "Temas de mentoria" : "O que você quer aprender"}</Label>
      <ChipInput value={form.mentorship_topics} onChange={(v) => onChange({ mentorship_topics: v })} placeholder="Ex: Primeiro emprego, Liderança... (Enter para adicionar)" />
    </div>
  )

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cargo atual" value={form.job_title} onValue={(v) => onChange({ job_title: v })} />
          <Field label="Empresa" value={form.company} onValue={(v) => onChange({ company: v })} />
          <Field label="LinkedIn" value={form.linkedin_url} onValue={(v) => onChange({ linkedin_url: v })} placeholder="linkedin.com/in/seu-perfil" />
          <Field label="Portfólio / GitHub" value={form.portfolio_url} onValue={(v) => onChange({ portfolio_url: v })} placeholder="github.com/voce" />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Interesses e habilidades</h3>
          {isMentor ? [expertise, topics] : [topics, expertise]}
          {!isMentor && (
            <div className="space-y-1">
              <Label>Objetivos com a mentoria</Label>
              <Textarea value={form.learning_goals} onChange={(e) => onChange({ learning_goals: e.target.value })} placeholder="O que você busca alcançar?" />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Formação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Instituição" value={form.institution} onValue={(v) => onChange({ institution: v })} />
            <Field label="Curso" value={form.course} onValue={(v) => onChange({ course: v })} />
            <Field label="Nível" value={form.academic_level} onValue={(v) => onChange({ academic_level: v })} placeholder="Ex: Graduação, Técnico..." />
            <Field label="Conclusão (prevista)" value={form.expected_graduation} onValue={(v) => onChange({ expected_graduation: v })} placeholder="Ex: 2027" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label className="mr-2">Currículo (PDF)</Label>
            {form.cv_url && (
              <Button type="button" variant="ghost" size="sm" onClick={() => window.open(form.cv_url, "_blank")}>
                <FileText className="h-4 w-4 mr-1 text-green-600" /> Ver PDF <Eye className="h-3 w-3 ml-1" />
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => cvInputRef.current?.click()} disabled={cvUpload.isUploading}>
              {cvUpload.isUploading ? "Enviando..." : form.cv_url ? "Trocar PDF" : "Enviar PDF"}
            </Button>
            <input ref={cvInputRef} type="file" accept=".pdf" onChange={handleCVUpload} className="hidden" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
