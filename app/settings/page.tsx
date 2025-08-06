import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Configurações</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Geral</CardTitle>
              <CardDescription>Gerencie suas preferências gerais da conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notificações por Email</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <Switch id="dark-mode" /> {/* This would typically be handled by ThemeProvider */}
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select defaultValue="pt-BR">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full">Salvar Configurações Gerais</Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Atualize sua senha e gerencie a segurança da conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Alterar Senha</Button>
              <Button variant="outline" className="w-full">Configurar Autenticação de Dois Fatores</Button>
              <Separator />
              <Button variant="destructive" className="w-full">Excluir Conta</Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacidade</CardTitle>
              <CardDescription>Controle quem pode ver seu perfil e informações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public-profile">Perfil Público</Label>
                <Switch id="public-profile" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-requests">Permitir Solicitações de Contato</Label>
                <Switch id="contact-requests" defaultChecked />
              </div>
              <Button variant="outline" className="w-full">Salvar Configurações de Privacidade</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
