'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Loader2, SearchIcon, CheckCircleIcon, XCircleIcon, EyeIcon, MailIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile } from '@/types/database'

interface MentorProfileForVerification extends user_profile {
  id: string;
  email: string;
}

async function fetchMentorsForVerification(): Promise<MentorProfileForVerification[]> {
  const response = await fetch('/api/admin/users?role=mentor&is_profile_complete=true&verified=false')
  if (!response.ok) {
    throw new Error('Failed to fetch mentors for verification')
  }
  const data = await response.json()
  return data.data
}

async function updateMentorVerification(userId: string, verified: boolean): Promise<MentorProfileForVerification> {
  const response = await fetch(`/api/admin/users/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: userId, verified_at: verified ? new Date().toISOString() : null }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update mentor verification status')
  }
  const data = await response.json()
  return data.data
}

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient()
  const { data: mentors, isLoading, isError, error } = useQuery<MentorProfileForVerification[], Error>({
    queryKey: ['mentorsForVerification'],
    queryFn: fetchMentorsForVerification,
  })

  const updateVerificationMutation = useMutation<MentorProfileForVerification, Error, { userId: string; verified: boolean }>({
    mutationFn: ({ userId, verified }) => updateMentorVerification(userId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorsForVerification'] })
      toast({
        title: 'Status de verificação atualizado!',
        description: 'O perfil do mentor foi atualizado com sucesso.',
      })
      setViewingMentor(null)
      setDialogOpen(false)
    },
    onError: (err) => {
      toast({
        title: 'Erro ao atualizar status de verificação',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [viewingMentor, setViewingMentor] = useState<MentorProfileForVerification | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredMentors = useMemo(() => {
    if (!mentors) return []
    return mentors.filter(mentor =>
      mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.current_position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [mentors, searchTerm])

  const handleViewClick = (mentor: MentorProfileForVerification) => {
    setViewingMentor({ ...mentor })
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setViewingMentor(null)
  }

  const handleApprove = () => {
    if (viewingMentor) {
      updateVerificationMutation.mutate({ userId: viewingMentor.id, verified: true })
    }
  }

  const handleReject = () => {
    if (viewingMentor) {
      updateVerificationMutation.mutate({ userId: viewingMentor.id, verified: false })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando mentores para verificação...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar mentores</h1>
        <p className="text-lg mb-6">{error?.message || 'Ocorreu um erro inesperado.'}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['mentorsForVerification'] })}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Verificação de Mentores</h1>

        <div className="mb-6 flex justify-end">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar mentores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cargo Atual</TableHead>
                <TableHead>Experiência</TableHead>
                <TableHead>Perfil Completo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => (
                  <TableRow key={mentor.id}>
                    <TableCell className="font-medium">{mentor.full_name || 'N/A'}</TableCell>
                    <TableCell>{mentor.email}</TableCell>
                    <TableCell>{mentor.current_position || 'N/A'}</TableCell>
                    <TableCell>{mentor.years_experience ? `${mentor.years_experience} anos` : 'N/A'}</TableCell>
                    <TableCell>{mentor.is_profile_complete ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewClick(mentor)}>
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum mentor aguardando verificação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {viewingMentor && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Perfil do Mentor</DialogTitle>
                <DialogDescription>
                  Revise as informações do mentor e decida sobre a verificação.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nome:</Label>
                  <span className="col-span-3">{viewingMentor.full_name}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">E-mail:</Label>
                  <span className="col-span-3">{viewingMentor.email}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Bio:</Label>
                  <p className="col-span-3 text-sm">{viewingMentor.bio || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Cargo:</Label>
                  <span className="col-span-3">{viewingMentor.current_position || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Empresa:</Label>
                  <span className="col-span-3">{viewingMentor.current_company || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Experiência:</Label>
                  <span className="col-span-3">{viewingMentor.years_experience ? `${viewingMentor.years_experience} anos` : 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Educação:</Label>
                  <span className="col-span-3">{viewingMentor.education_level || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Habilidades:</Label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {viewingMentor.skills?.map((skill, index) => (
                      <span key={index} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                        {skill.skill_name} ({skill.proficiency_level})
                      </span>
                    )) || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Comprovante:</Label>
                  <span className="col-span-3">
                    {viewingMentor.proof_of_experience_url ? (
                      <a href={viewingMentor.proof_of_experience_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        Ver Documento
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>
                  <XCircleIcon className="mr-2 h-4 w-4" /> Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={updateVerificationMutation.isPending}
                >
                  <XCircleIcon className="mr-2 h-4 w-4" /> Rejeitar
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={updateVerificationMutation.isPending}
                >
                  {updateVerificationMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                  )}
                  Aprovar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  )
}
