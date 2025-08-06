'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MenuIcon, UserIcon, LogOutIcon, SettingsIcon, LayoutDashboardIcon, UsersIcon, BookOpenIcon, CalendarDaysIcon, MessageSquareIcon, GlobeIcon, InfoIcon, HandshakeIcon, DollarSignIcon } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { useAuth } from '@/hooks/useAuth'
import { useUserRoles } from '@/app/context/user-roles-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export function Header() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { userRole, isAdmin, isMentor, isMentee, isLoadingRoles } = useUserRoles()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Deslogado com sucesso!',
        description: 'Você foi desconectado da sua conta.',
        variant: 'default',
      })
      router.push('/login')
    } catch (error: any) {
      toast({
        title: 'Erro ao deslogar',
        description: error.message || 'Ocorreu um erro inesperado ao tentar deslogar.',
        variant: 'destructive',
      })
    }
  }

  const navLinks = [
    { href: '/mentors', label: 'Mentores', icon: <BookOpenIcon className="mr-2 h-4 w-4" /> },
    { href:
