'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Database } from '@/types/database'
import { Loader2Icon } from 'lucide-react'
import { getAdminUsers, updateAdminUser } from '@/services/auth/supabase' // Using client-side supabase for admin actions

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export default function AdminVerificationsPage() {
  const [pendingMentors, setPendingMentors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getAdminUsers(); // Fetch all users
      if (error) {
        throw error;
      }
      // Filter for mentors with status 'pending'
      const filteredMentors = data?.filter(user => user.role === 'mentor' && user.status === 'pending') || [];
      setPendingMentors(filteredMentors);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending mentors.');
      toast({
        title: 'Erro ao carregar mentores pendentes',
        description: err.message || 'Não foi possível carregar a lista de mentores para verificação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMentors();
  }, []);

  const handleVerify = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await updateAdminUser(userId, { status: 'verified' });
      if (error) {
        throw error;
      }
      toast({
        title: 'Mentor Verificado!',
        description: 'O perfil do mentor foi marcado como verificado com sucesso.',
        variant: 'default',
      });
      fetchPendingMentors(); // Re-fetch to update the list
    } catch (err: any) {
      toast({
        title: 'Erro ao verificar mentor',
        description: err.message || 'Não foi possível verificar o perfil do mentor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await updateAdminUser(userId, { status: 'rejected' }); // Or 'suspended', 'inactive'
      if (error) {
        throw error;
      }
      toast({
        title: 'Mentor Rejeitado!',
        description: 'O perfil do mentor foi marcado como rejeitado.',
        variant: 'default',
      });
      fetchPendingMentors(); // Re-fetch to update the list
    } catch (err: any) {
      toast({
        title: 'Erro ao rejeitar mentor',
        description: err.message || 'Não foi possível rejeitar o perfil do mentor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando verificações...</span>
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Verificações de Mentor</h1>

        <Card>
          <CardHeader>
            <CardTitle>Mentores Pendentes de Verificação</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingMentors.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum mentor pendente de verificação no momento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>{mentor.full_name}</TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>{new Date(mentor.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => handleVerify(mentor.id)}>
                          Verificar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(mentor.id)}>
                          Rejeitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
