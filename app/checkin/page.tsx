"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Mail, Activity, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCreateVolunteerHour } from '@/hooks/api/use-volunteer-hours';

const volunteerHourSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  hours: z.number().min(0.5, 'Mínimo de 0.5 horas').max(24, 'Máximo de 24 horas'),
  activity: z.string().min(3, 'Atividade deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
});

type VolunteerHourForm = z.infer<typeof volunteerHourSchema>;

export default function CheckinPage() {
  const [date, setDate] = useState<Date>();
  const createVolunteerHour = useCreateVolunteerHour();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VolunteerHourForm>({
    resolver: zodResolver(volunteerHourSchema),
    defaultValues: {
      date: new Date(),
      hours: 1,
    },
  });

  const onSubmit = async (data: VolunteerHourForm) => {
    if (!date) {
      return;
    }

    const volunteerData = {
      ...data,
      date: format(date, 'yyyy-MM-dd'),
    };

    try {
      await createVolunteerHour.mutateAsync(volunteerData);
      reset();
      setDate(new Date());
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Check-in de Voluntariado
            </CardTitle>
            <CardDescription>
              Registre suas horas de voluntariado para contribuir com nossa comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    {...register('name')}
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className={cn(errors.email && 'border-red-500')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Data e Horas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Data do Voluntariado *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {!date && (
                    <p className="text-sm text-red-500">Data é obrigatória</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horas Trabalhadas *
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    placeholder="1.5"
                    {...register('hours', { valueAsNumber: true })}
                    className={cn(errors.hours && 'border-red-500')}
                  />
                  {errors.hours && (
                    <p className="text-sm text-red-500">{errors.hours.message}</p>
                  )}
                </div>
              </div>

              {/* Atividade */}
              <div className="space-y-2">
                <Label htmlFor="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atividade Realizada *
                </Label>
                <Input
                  id="activity"
                  placeholder="Ex: Mentoria, Organização de eventos, Suporte técnico"
                  {...register('activity')}
                  className={cn(errors.activity && 'border-red-500')}
                />
                {errors.activity && (
                  <p className="text-sm text-red-500">{errors.activity.message}</p>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição (Opcional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva brevemente o que foi realizado..."
                  {...register('description')}
                  rows={3}
                />
              </div>

              {/* Botão de Envio */}
              <Button
                type="submit"
                className="w-full"
                disabled={createVolunteerHour.isPending}
              >
                {createVolunteerHour.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Horas de Voluntariado'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 