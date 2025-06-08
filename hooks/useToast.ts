import { toast } from 'sonner'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    if (variant === 'destructive') {
      toast.error(title, { description })
    } else {
      toast.success(title, { description })
    }
  }

  return {
    toast: showToast,
  }
} 