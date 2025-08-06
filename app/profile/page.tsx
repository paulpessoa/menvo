'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2, User, Mail, MapPin, Briefcase, GraduationCap, Languages, Linkedin, Globe, Plus, Edit, Save, Upload, XCircle, CheckCircle, Shield, Star } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from "@/hooks/useUserProfile"
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_skill, user_role } from '@/types/database'
import { useTranslation } from "react-i18next"

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading, updateUserProfile, uploadProfilePhoto } = useUserProfile(user?.id)
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<user_profile>>({})
  const [skills, setSkills] = useState<user_skill[]>([])
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillCategory, setNewSkillCategory] = useState<string | undefined>(undefined)
  const [newSkillProficiency, setNewSkillProficiency] = useState<string | undefined>(undefined)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/unauthorized")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        years_experience: userProfile.years_experience || null,
        education_level: userProfile.education_level || null,
        languages: userProfile.languages || [],
        social_links: userProfile.social_links || {},
        current_position: userProfile.current_position || "",
        current_company: userProfile.current_company || "",
        role: userProfile.role || "mentee", // Default to mentee if not set
        is_profile_complete: userProfile.is_profile_complete || false,
      })
      setSkills(userProfile.skills || [])
    }
  }, [userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }))
  }

  const handleAddSkill = () => {
    if (newSkillName.trim() && newSkillCategory && newSkillProficiency) {
      setSkills((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`, // Temporary ID for new skills
          user_id: user?.id || "",
          skill_name: newSkillName.trim(),
          skill_category: newSkillCategory,
          proficiency_level: newSkillProficiency,
          is_mentor_skill: formData.role === 'mentor', // Default based on current role
          is_learning_skill: formData.role === 'mentee', // Default based on current role
          created_at: new Date().toISOString(),
        },
      ])
      setNewSkillName("")
      setNewSkillCategory(undefined)
      setNewSkillProficiency(undefined)
    } else {
      toast({
        title: "Erro ao adicionar habilidade",
        description: "Por favor, preencha o nome, categoria e nível da habilidade.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== skillId))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }
    const file = event.target.files[0]
    setIsUploadingPhoto(true)
    try {
      const { publicUrl, error } = await uploadProfilePhoto(file)
      if (error) throw error
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }))
      toast({
        title: "Foto de perfil atualizada!",
        description: "Sua nova foto de perfil foi salva.",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload da foto",
        description: error.message || "Não foi possível fazer upload da sua foto.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSavingProfile(true)
    try {
      const { error } = await updateUserProfile(user.id, {
        ...formData,
        skills: skills, // Pass skills array to the update function
      })

      if (error) throw error

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações de perfil foram salvas com sucesso.",
        variant: "default",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Não foi possível salvar suas alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (authLoading || profileLoading || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando perfil...</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Meu Perfil</h1>
          <Button onClick={() => setIsEditing(!isEditing)} disabled={isSavingProfile || isUploadingPhoto}>
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isSavingProfile ? "Salvando..." : "Salvar Perfil"}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center p-6">
              <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 border-4 border-background shadow-lg bg-muted">
                <Avatar className="h-full w-full">
                  <AvatarImage src={formData.avatar_url || "/placeholder-user.jpg"} alt={formData.full_name || "User"} />
                  <AvatarFallback className="text-5xl">{formData.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Label htmlFor="profile-photo-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full">
                    {isUploadingPhoto ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                    <Input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                    <span className="sr-only">Upload photo</span>
                  </Label>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1">{formData.full_name || "Nome Completo"}</h2>
              <p className="text-muted-foreground mb-2">{user.email}</p>
              <Badge variant="secondary" className="capitalize mb-4">
                {formData.role || "Mentee"}
              </Badge>

              <Separator className="w-full my-4" />

              <div className="w-full space-y-3 text-sm text-muted-foreground">
                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.current_position && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{formData.current_position} {formData.current_company && `at ${formData.current_company}`}</span>
                  </div>
                )}
                {formData.education_level && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{formData.education_level}</span>
                  </div>
                )}
                {formData.years_experience !== null && formData.years_experience !== undefined && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>{formData.years_experience} anos de experiência</span>
                  </div>
                )}
                {formData.languages && formData.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <span>{formData.languages.join(", ")}</span>
                  </div>
                )}
                {formData.social_links?.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    <a href={formData.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="underline">
                      LinkedIn
                    </a>
                  </div>
                )}
                {formData.social_links?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a href={formData.social_links.website} target="_blank" rel="noopener noreferrer" className="underline">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Details & Edit Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Atualize seus dados pessoais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Fale um pouco sobre você, seus interesses e o que busca na mentoria..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Cidade, Estado, País"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Eu sou um(a)</Label>
                  <Select
                    value={formData.role || "mentee"}
                    onValueChange={(value: user_role) => handleSelectChange("role", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
                <CardDescription>Detalhes sobre sua carreira e educação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_position">Cargo Atual</Label>
                    <Input
                      id="current_position"
                      value={formData.current_position || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ex: Desenvolvedor Frontend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_company">Empresa Atual</Label>
                    <Input
                      id="current_company"
                      value={formData.current_company || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ex: Tech Solutions Ltda."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Anos de Experiência</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      value={formData.years_experience || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education_level">Nível de Educação</Label>
                    <Select
                      value={formData.education_level || ""}
                      onValueChange={(value) => handleSelectChange("education_level", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">Ensino Médio</SelectItem>
                        <SelectItem value="bachelor">Graduação</SelectItem>
                        <SelectItem value="master">Mestrado</SelectItem>
                        <SelectItem value="phd">Doutorado</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages">Idiomas (separados por vírgula)</Label>
                  <Input
                    id="languages"
                    value={formData.languages?.join(", ") || ""}
                    onChange={(e) => handleSelectChange("languages", e.target.value.split(',').map(lang => lang.trim()).filter(Boolean))}
                    disabled={!isEditing}
                    placeholder="Ex: Português, Inglês, Espanhol"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
                <CardDescription>Adicione suas habilidades e áreas de interesse.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="flex items-center gap-2">
                      {skill.skill_name} ({skill.proficiency_level})
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveSkill(skill.id)}
                        >
                          <XCircle className="h-3 w-3" />
                          <span className="sr-only">Remover habilidade</span>
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="new-skill-name">Nome da Habilidade</Label>
                      <Input
                        id="new-skill-name"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="Ex: React, Liderança"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-skill-category">Categoria</Label>
                      <Select
                        value={newSkillCategory}
                        onValueChange={setNewSkillCategory}
                      >
                        <SelectTrigger id="new-skill-category">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Técnica</SelectItem>
                          <SelectItem value="soft_skill">Soft Skill</SelectItem>
                          <SelectItem value="business">Negócios</SelectItem>
                          <SelectItem value="other">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-skill-proficiency">Nível</Label>
                      <Select
                        value={newSkillProficiency}
                        onValueChange={setNewSkillProficiency}
                      >
                        <SelectTrigger id="new-skill-proficiency">
                          <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Iniciante</SelectItem>
                          <SelectItem value="intermediate">Intermediário</SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                          <SelectItem value="expert">Especialista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                      <Button onClick={handleAddSkill} type="button" variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Habilidade
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Links Sociais</CardTitle>
                <CardDescription>Adicione links para suas redes sociais e portfólio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={formData.social_links?.linkedin || ""}
                    onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website / Portfólio URL</Label>
                  <Input
                    id="website"
                    value={formData.social_links?.website || ""}
                    onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://seusite.com"
                  />
                </div>
                {/* Add more social links as needed */}
              </CardContent>
            </Card>

            {/* Mentor Specific Section (if role is mentor) */}
            {formData.role === 'mentor' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Verificação de Mentor
                  </CardTitle>
                  <CardDescription>
                    Informações para verificação do seu perfil como mentor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proof_of_experience_url">Link para Comprovante de Experiência (Opcional)</Label>
                    <Input
                      id="proof_of_experience_url"
                      value={formData.proof_of_experience_url || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Link para seu currículo, portfólio, certificações, etc."
                    />
                    <p className="text-xs text-muted-foreground">
                      Este link será usado para verificar sua experiência como mentor.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_profile_complete"
                      checked={formData.is_profile_complete || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_profile_complete: checked as boolean })}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="is_profile_complete" className="text-sm font-normal">
                      Marcar perfil como completo e pronto para revisão
                    </Label>
                  </div>
                  {!formData.is_profile_complete && (
                    <div className="flex items-start gap-2 text-yellow-600 text-sm">
                      {/* Info icon should be imported */}
                      <span className="h-4 w-4 flex-shrink-0 mt-0.5">Info</span>
                      <p>
                        Seu perfil de mentor não está completo. Preencha todas as informações e marque a caixa acima para que seu perfil possa ser revisado e aprovado.
                      </p>
                    </div>
                  )}
                  {userProfile.verified_at && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-5 w-5" />
                      <p>Seu perfil de mentor foi verificado em {new Date(userProfile.verified_at).toLocaleDateString()}.</p>
                    </div>
                  )}
                  {!userProfile.verified_at && formData.is_profile_complete && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      {/* Info icon should be imported */}
                      <span className="h-4 w-4 flex-shrink-0 mt-0.5">Info</span>
                      <p>Seu perfil está aguardando revisão e verificação.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEditing && (
              <Button onClick={handleSaveProfile} className="w-full" disabled={isSavingProfile || isUploadingPhoto}>
                {isSavingProfile ? "Salvando..." : "Salvar Perfil"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
