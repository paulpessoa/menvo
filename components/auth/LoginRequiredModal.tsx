'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LockIcon } from 'lucide-react'

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginRequiredModal({ isOpen, onClose, message }: LoginRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <LockIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <DialogTitle className="text-2xl font-bold">Login Necessário</DialogTitle>
          <DialogDescription>
            {message || 'Você precisa estar logado para acessar este conteúdo ou funcionalidade.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Link href="/login" passHref>
            <Button className="w-full sm:w-auto">Fazer Login</Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="outline" className="w-full sm:w-auto">Criar Conta</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
