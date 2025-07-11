"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    expertise_areas: "",
    linkedin_url: "",
    presentation_video_url: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setIsSubmitting(true)
    try {
      const updateData = {
        ...formData,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (error) throw error

      await refreshProfile()
      onClose()
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isMentor = profile?.role === "mentor"

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">Biografia *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Conte um pouco sobre você..."
              required
            />
          </div>

          {isMentor && (
            <>
              <div>
                <Label htmlFor="expertise_areas">Áreas de expertise *</Label>
                <Input
                  id="expertise_areas"
                  value={formData.expertise_areas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expertise_areas: e.target.value }))}
                  placeholder="Ex: Desenvolvimento Web, Product Management"
                  required
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/seu-perfil"
                />
              </div>

              <div>
                <Label htmlFor="presentation_video_url">Vídeo de apresentação (YouTube) *</Label>
                <Input
                  id="presentation_video_url"
                  type="url"
                  value={formData.presentation_video_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, presentation_video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Grave um vídeo de 2-3 minutos se apresentando e explicando como pode ajudar
                </p>
              </div>
            </>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando..." : "Finalizar cadastro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
