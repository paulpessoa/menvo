'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Database } from '@/types/database'
import { Loader2Icon } from 'lucide-react'
import { getAdminUsers, updateAdminUser } from '@/services/auth/supabase' // Using client-side supabase for admin actions

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [editedRole, setEditedRole] = useState<UserRole | undefined>(undefined);
  const [editedStatus, setEditedStatus] = useState<string | undefined>(undefined); // Assuming status is a string

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getAdminUsers();
      if (error) {
        throw error;
      }
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
      toast({
        title: 'Erro ao carregar usuários',
        description: err.message || 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
    }
  }, [user, authLoading]);

  const handleEditClick = (user: UserProfile) => {
    setCurrentUser(user);
    setEditedRole(user.role || undefined);
    setEditedStatus(user.status || undefined);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const updates: Partial<UserProfile> = {};
      if (editedRole !== undefined && editedRole !== currentUser.role) {
        updates.role = editedRole;
      }
      if (editedStatus !== undefined && editedStatus !== currentUser.status) {
        updates.status = editedStatus;
      }

      if (Object.keys(updates).length > 0) {
        const { data, error } = await updateAdminUser(currentUser.id, updates);
        if (error) {
          throw error;
        }
        toast({
          title: 'Usuário atualizado!',
          description: `O perfil de ${currentUser.full_name} foi atualizado com sucesso.`,
          variant: 'default',
        });
        fetchUsers(); // Re-fetch users to get the latest data
      } else {
        toast({
          title: 'Nenhuma alteração',
          description: 'Nenhuma alteração foi feita no perfil do usuário.',
          variant: 'info',
        });
      }
      setIsEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
      toast({
        title: 'Erro ao atualizar usuário',
        description: err.message || 'Não foi possível atualizar o perfil do usuário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Erro: {error}
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Gerenciamento de Usuários</h1>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perfil Completo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{user.is_profile_complete ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {currentUser && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Usuário: {currentUser.full_name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" value={currentUser.email || ''} className="col-span-3" disabled />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Função
                  </Label>
                  <Select value={editedRole} onValueChange={(value: UserRole) => setEditedRole(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select value={editedStatus} onValueChange={(value: string) => setEditedStatus(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="verified">Verificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  );
}
