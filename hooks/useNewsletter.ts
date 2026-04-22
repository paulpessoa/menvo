import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newsletterService, NewsletterSubscription } from '@/lib/services/newsletter/newsletter.service'
import { toast } from 'sonner'

// Hook para inscrever na newsletter
export const useNewsletterSubscribe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      email: string
      name?: string
      whatsapp?: string
      consent_given: boolean
    }) => {
      // Capturar informações do browser para LGPD
      const ip_address = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => undefined)

      const user_agent = navigator.userAgent

      return newsletterService.subscribe({
        ...data,
        ip_address,
        user_agent
      })
    },
    onSuccess: () => {
      toast.success('🎉 Inscrição realizada com sucesso!', {
        description: 'Você receberá nossas novidades e atualizações.'
      })
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao se inscrever', {
        description: error.message
      })
    }
  })
}

// Hook para cancelar inscrição
export const useNewsletterUnsubscribe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: newsletterService.unsubscribe,
    onSuccess: () => {
      toast.success('Inscrição cancelada com sucesso')
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar inscrição', {
        description: error.message
      })
    }
  })
}

// Hook para verificar se email está inscrito
export const useCheckNewsletterSubscription = (email: string) => {
  return useQuery({
    queryKey: ['newsletter-subscription', email],
    queryFn: () => newsletterService.checkSubscription(email),
    enabled: !!email && email.includes('@'),
    retry: false
  })
}

// Hook para listar inscrições (admin)
export const useNewsletterSubscriptions = () => {
  return useQuery({
    queryKey: ['newsletter-subscriptions'],
    queryFn: newsletterService.getActiveSubscriptions
  })
}

// Hook para estatísticas (admin)
export const useNewsletterStats = () => {
  return useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: newsletterService.getStats
  })
}
