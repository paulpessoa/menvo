'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { getAllSubscribers, sendNewsletterEmail } from '@/services/newsletter/newsletter' // Assuming these services exist
import { Loader2Icon, MailIcon } from 'lucide-react'

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export function NewsletterDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loadingSubscribers, setLoadingSubscribers] = useState(true)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true)
    try {
      const { data, error } = await getAllSubscribers()
      if (error) {
        throw error
      }
      setSubscribers(data || [])
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar assinantes',
        description: error.message || 'Não foi possível carregar a lista de assinantes.',
        variant: 'destructive',
      })
    } finally {
      setLoadingSubscribers(false)
    }
  }

  const handleSendNewsletter = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Assunto e corpo do e-mail não podem estar vazios.',
        variant: 'destructive',
      })
      return
    }

    setSendingEmail(true)
    try {
      // In a real application, you'd send to a backend endpoint that handles sending to all subscribers
      // For this mock, we'll simulate sending to each
      const recipientEmails = subscribers.map(s => s.email)
      const { error } = await sendNewsletterEmail(recipientEmails, emailSubject, emailBody)

      if (error) {
        throw error
      }

      toast({
        title: 'Newsletter enviada!',
        description: `O e-mail foi enviado para ${subscribers.length} assinantes.`,
        variant: 'default',
      })
      setEmailSubject('')
      setEmailBody('')
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar newsletter',
        description: error.message || 'Ocorreu um erro ao tentar enviar a newsletter.',
        variant: 'destructive',
      })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Newsletter Sending Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="h-5 w-5" />
            Enviar Newsletter
          </CardTitle>
          <CardDescription>Crie e envie e-mails para todos os assinantes da newsletter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email-subject">Assunto</Label>
            <Input
              id="email-subject"
              placeholder="Assunto do seu e-mail"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              disabled={sendingEmail}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-body">Corpo do E-mail</Label>
            <Textarea
              id="email-body"
              placeholder="Escreva o conteúdo da sua newsletter aqui..."
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              disabled={sendingEmail}
            />
          </div>
          <Button onClick={handleSendNewsletter} className="w-full" disabled={sendingEmail}>
            {sendingEmail ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              'Enviar Newsletter'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assinantes da Newsletter</CardTitle>
          <CardDescription>Lista de todos os usuários inscritos na newsletter.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSubscribers ? (
            <div className="flex justify-center items-center h-32">
              <Loader2Icon className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando assinantes...</span>
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum assinante encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell>{new Date(subscriber.subscribed_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
