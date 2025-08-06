'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Briefcase, GraduationCap, Globe, Github, Linkedin, Phone } from 'lucide-react'

interface OnboardingData {
  name: string
  bio: string
  role: 'mentor' | 'mentee'
  location: string
  skills: string[]
  experience_level: string
  linkedin_url: string
  github_url: string
  website_url: string
  phone: string
  company: string
  position: string
  years_of_experience: number
  languages: string[]
}

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C#',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native',
  'Vue.js', 'Angular', 'Svelte', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'Laravel', 'Ruby on Rails', 'ASP.NET', 'GraphQL', 'REST API', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'Google Cloud', 'DevOps', 'CI/CD', 'Git', 'Linux', 'Machine Learning',
  'Data Science', 'UI/UX Design', 'Product Management', 'Agile', 'Scrum'
]

const LANGUAGE_OPTIONS = [
  'Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano',
  '中文', '日本語', '한국어', 'العربية', 'Русский', 'हिन्दी'
]

const EXPERIENCE_LEVELS = [
  'Iniciante (0-1 anos)',
  'Júnior (1-3 anos)',
  'Pleno (3-5 anos)',
  'Sênior (5-8 anos)',
  'Especialista (8+ anos)',
  'Líder Técnico',
  'Arquiteto de Software',
  'CTO/VP Engineering'
]

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    bio: '',
    role: 'mentee',
    location: '',
    skills: [],
    experience_level: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    phone: '',
    company: '',
    position: '',
    years_of_experience: 0,
    languages: ['Português']
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Verificar se já tem perfil completo
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile && profile.name && profile.role) {
        router.push('/dashboard')
        return
      }

      // Pré-preencher com dados do OAuth se disponível
      if (user.user_metadata) {
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata.full_name || user.user_metadata.name || prev.name,
        }))
      }

    } catch (err) {
      setError('Erro ao carregar dados do usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }))
    }
    setLanguageInput('')
  }

  const removeLanguage = (language: string) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(l => l !== language)
      }))
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setSaving(true)
    setError('')

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        setError('Nome é obrigatório')
        return
      }

      if (!formData.role) {
        setError('Selecione seu papel na plataforma')
        return
      }

      if (formData.role === 'mentor' && formData.skills.length === 0) {
        setError('Mentores devem adicionar pelo menos uma habilidade')
        return
      }

      // Atualizar perfil no Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          bio: formData.bio.trim() || null,
          role: formData.role,
          location: formData.location.trim() || null,
          skills: formData.skills,
          experience_level: formData.experience_level || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          github_url: formData.github_url.trim() || null,
          website_url: formData.website_url.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          position: formData.position.trim() || null,
          years_of_experience: formData.years_of_experience || null,
          languages: formData.languages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Redirecionar para dashboard
      router.push('/dashboard')

    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo ao Mentor Connect!</CardTitle>
            <CardDescription>
              Vamos configurar seu perfil para você começar a usar a plataforma
            </CardDescription>
            
            {user && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.user_metadata?.name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium">{user.user_metadata?.name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progresso */}
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Informações Básicas */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    placeholder="Conte um pouco sobre você, sua experiência e objetivos..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Cidade, Estado, País"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Qual é o seu papel na plataforma? *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.role === 'mentee' ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleInputChange('role', 'mentee')}
                    >
                      <CardContent className="p-4 text-center">
                        <GraduationCap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-semibold">Mentee</h4>
                        <p className="text-sm text-muted-foreground">
                          Quero aprender e receber mentoria
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.role === 'mentor' ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleInputChange('role', 'mentor')}
                    >
                      <CardContent className="p-4 text-center">
                        <Briefcase className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-semibold">Mentor</h4>
                        <p className="text-sm text-muted-foreground">
                          Quero compartilhar conhecimento e ajudar outros
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!formData.name.trim() || !formData.role}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 2: Habilidades e Experiência */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Habilidades e Experiência</h3>

                <div className="space-y-2">
                  <Label>Habilidades {formData.role === 'mentor' && '*'}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite uma habilidade"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill(skillInput)
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SKILL_OPTIONS.slice(0, 10).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_level">Nível de Experiência</Label>
                  <select
                    id="experience_level"
                    className="w-full p-2 border rounded-md"
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  >
                    <option value="">Selecione seu nível</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa Atual</Label>
                    <Input
                      id="company"
                      placeholder="Nome da empresa"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo Atual</Label>
                    <Input
                      id="position"
                      placeholder="Seu cargo"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Anos de Experiência</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={formData.years_of_experience || ''}
                    onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Idiomas</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite um idioma"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addLanguage(languageInput)
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => addLanguage(languageInput)}
                      disabled={!languageInput.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LANGUAGE_OPTIONS.slice(0, 6).map((language) => (
                      <Badge
                        key={language}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addLanguage(language)}
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>

                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.languages.map((language) => (
                        <Badge
                          key={language}
                          className="cursor-pointer"
                          onClick={() => removeLanguage(language)}
                        >
                          {language} {formData.languages.length > 1 && '×'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    className="flex-1"
                    disabled={formData.role === 'mentor' && formData.skills.length === 0}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Contato e Redes Sociais */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato e Redes Sociais</h3>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+55 (11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="linkedin_url"
                      placeholder="https://linkedin.com/in/seuperfil"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github_url"
                      placeholder="https://github.com/seuusuario"
                      value={formData.github_url}
                      onChange={(e) => handleInputChange('github_url', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website/Portfolio</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website_url"
                      placeholder="https://seusite.com"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Quase pronto!</h4>
                  <p className="text-blue-800 text-sm">
                    Seu perfil será enviado para validação manual. Você receberá uma notificação 
                    quando for aprovado e poderá começar a usar todas as funcionalidades da plataforma.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
