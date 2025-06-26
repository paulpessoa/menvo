import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface VolunteerHour {
  id?: string;
  name: string;
  email: string;
  date: string;
  hours: number | string; // Pode vir como string do SheetDB
  activity: string;
  description?: string;
  created_at?: string;
}

// Buscar todas as horas de voluntariado
export const useVolunteerHours = () => {
  return useQuery({
    queryKey: ['volunteer-hours'],
    queryFn: async (): Promise<VolunteerHour[]> => {
      const response = await fetch('/api/sheetdb/volunteer-hours');
      if (!response.ok) {
        throw new Error('Erro ao buscar horas de voluntariado');
      }
      return response.json();
    },
  });
};

// Salvar nova hora de voluntariado
export const useCreateVolunteerHour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<VolunteerHour, 'id' | 'created_at'>) => {
      const response = await fetch('/api/sheetdb/volunteer-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar hora de voluntariado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-hours'] });
      toast.success('Hora de voluntariado registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar hora de voluntariado');
    },
  });
};

// Hook para buscar horas de voluntariado com filtros
export const useVolunteerHoursWithFilters = (
  filters: {
    person?: string;
    sortBy?: 'name' | 'hours';
    sortOrder?: 'asc' | 'desc';
  } = {}
) => {
  return useQuery({
    queryKey: ['volunteer-hours', filters],
    queryFn: async (): Promise<VolunteerHour[]> => {
      const response = await fetch('/api/sheetdb/volunteer-hours');
      if (!response.ok) {
        throw new Error('Erro ao buscar horas de voluntariado');
      }
      const data: VolunteerHour[] = await response.json();
      
      // Aplicar filtros
      let filteredData = data;

      // Filtrar por pessoa
      if (filters.person) {
        filteredData = filteredData.filter(
          item => item.name.toLowerCase().includes(filters.person!.toLowerCase()) ||
                  item.email.toLowerCase().includes(filters.person!.toLowerCase())
        );
      }

      // Ordenar
      if (filters.sortBy) {
        filteredData.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          if (filters.sortBy === 'name') {
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
          } else {
            // Converter hours para número para ordenação
            const aHours = typeof a.hours === 'string' ? parseFloat(a.hours) : a.hours;
            const bHours = typeof b.hours === 'string' ? parseFloat(b.hours) : b.hours;
            aValue = isNaN(aHours) ? 0 : aHours;
            bValue = isNaN(bHours) ? 0 : bHours;
          }

          if (filters.sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });
      }

      return filteredData;
    },
  });
}; 