"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Briefcase, Camera } from "lucide-react"
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useUserRoles } from "@/hooks/useUserRoles"
import { useUser } from "@/hooks/useUser"

export default function ProfilePage() {

    const { data: userRoles } = useUserRoles()
    const user = useUser()
    const isMentor = userRoles?.roles.some(role => role.role_type === 'mentor' && role.status === 'active')
    const isMentee = userRoles?.roles.some(role => role.role_type === 'mentee' && role.status === 'active')
  console.log(user, isMentee, isMentor)
  return (
        // <ProtectedRoute requiredRoles={['mentor', 'mentee', 'viewer']}>

    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e profissionais
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Suas informações principais visíveis para outros usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback className="text-lg">JD</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">João da Silva</h3>
                <p className="text-muted-foreground">Senior Software Engineer</p>
                <div className="flex gap-2">
                  <Badge variant="default">Mentor</Badge>
                  <Badge variant="secondary">Verificado</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" defaultValue="João" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" defaultValue="da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" defaultValue="joao@exemplo.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input id="phone" defaultValue="+55 11 99999-9999" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informações Profissionais
            </CardTitle>
            <CardDescription>
              Detalhes sobre sua experiência e área de atuação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Cargo Atual</Label>
              <Input id="jobTitle" defaultValue="Senior Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" defaultValue="Tech Solutions Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input id="location" defaultValue="São Paulo, SP" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea 
                id="bio" 
                placeholder="Conte um pouco sobre sua experiência e o que você pode oferecer como mentor..."
                defaultValue="Desenvolvedor com mais de 8 anos de experiência em tecnologias web. Especialista em React, Node.js e arquitetura de sistemas. Apaixonado por ensinar e ajudar outros desenvolvedores a crescerem em suas carreiras."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills & Expertise */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades e Especialidades</CardTitle>
            <CardDescription>
              Áreas em que você pode oferecer mentoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">JavaScript</Badge>
                <Badge variant="outline">React</Badge>
                <Badge variant="outline">Node.js</Badge>
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">Python</Badge>
                <Badge variant="outline">AWS</Badge>
                <Badge variant="outline">Docker</Badge>
                <Badge variant="outline">Liderança</Badge>
              </div>
              <Button variant="outline" size="sm">
                Gerenciar Habilidades
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Alterações</Button>
        </div>
      </div>
    </div>
  )
}
