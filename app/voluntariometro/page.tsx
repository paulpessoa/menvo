"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  ArrowUpDown, 
  Clock, 
  User, 
  Mail, 
  Calendar, 
  Activity,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useVolunteerHoursWithFilters } from '@/hooks/api/use-volunteer-hours';

export default function VoluntariometroPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hours'>('hours');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: volunteerHours, isLoading, error } = useVolunteerHoursWithFilters({
    person: searchTerm,
    sortBy,
    sortOrder,
  });

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!volunteerHours) return null;

    const totalHours = volunteerHours.reduce((sum, item) => {
      const hours = typeof item.hours === 'string' ? parseFloat(item.hours) : item.hours;
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    
    const uniqueVolunteers = new Set(volunteerHours.map(item => item.email)).size;
    const totalActivities = volunteerHours.length;

    // Top 5 voluntários por horas
    const volunteerStats = volunteerHours.reduce((acc, item) => {
      const key = item.email;
      const hours = typeof item.hours === 'string' ? parseFloat(item.hours) : item.hours;
      const validHours = isNaN(hours) ? 0 : hours;
      
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          email: item.email,
          totalHours: 0,
          activities: 0,
        };
      }
      acc[key].totalHours += validHours;
      acc[key].activities += 1;
      return acc;
    }, {} as Record<string, { name: string; email: string; totalHours: number; activities: number }>);

    const topVolunteers = Object.values(volunteerStats)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);

    return {
      totalHours,
      uniqueVolunteers,
      totalActivities,
      topVolunteers,
      volunteerStats,
    };
  }, [volunteerHours]);

  // Lista de voluntários únicos para o filtro
  const uniqueVolunteersList = useMemo(() => {
    if (!stats?.volunteerStats) return [];
    
    return Object.values(stats.volunteerStats)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(volunteer => ({
        value: volunteer.email,
        label: volunteer.name,
        hours: volunteer.totalHours,
      }));
  }, [stats?.volunteerStats]);

  // Filtrar dados por voluntário selecionado
  const filteredVolunteerHours = useMemo(() => {
    if (!volunteerHours) return [];
    if (!selectedVolunteer || selectedVolunteer === 'all') return volunteerHours;
    
    return volunteerHours.filter(item => item.email === selectedVolunteer);
  }, [volunteerHours, selectedVolunteer]);

  const handleSort = (field: 'name' | 'hours') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleVolunteerFilterChange = (value: string) => {
    setSelectedVolunteer(value);
    setSearchTerm(''); // Limpar busca por texto quando selecionar voluntário
  };

  const clearFilters = () => {
    setSelectedVolunteer('all');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-red-500">Erro ao carregar dados: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Voluntariômetro</h1>
          <p className="text-muted-foreground">
            Acompanhe as horas de voluntariado da nossa comunidade
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                    <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Voluntários Únicos</p>
                    <p className="text-2xl font-bold">{stats.uniqueVolunteers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Atividades Realizadas</p>
                    <p className="text-2xl font-bold">{stats.totalActivities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Média por Voluntário</p>
                    <p className="text-2xl font-bold">
                      {stats.uniqueVolunteers > 0 
                        ? (stats.totalHours / stats.uniqueVolunteers).toFixed(1) 
                        : '0'}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Voluntários */}
        {stats && stats.topVolunteers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top 5 Voluntários
              </CardTitle>
              <CardDescription>
                Voluntários com mais horas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.topVolunteers.map((volunteer, index) => (
                  <div
                    key={volunteer.email}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{volunteer.name}</p>
                        <p className="text-sm text-muted-foreground">{volunteer.activities} atividades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{volunteer.totalHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros e Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Voluntariado</CardTitle>
            <CardDescription>
              Lista completa de todas as horas registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedVolunteer} onValueChange={handleVolunteerFilterChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por voluntário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os voluntários</SelectItem>
                    {uniqueVolunteersList.map((volunteer) => (
                      <SelectItem key={volunteer.value} value={volunteer.value}>
                        {volunteer.label} ({volunteer.hours.toFixed(1)}h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'name' | 'hours') => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Por Horas</SelectItem>
                    <SelectItem value="name">Por Nome</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>

                {(selectedVolunteer !== 'all' || searchTerm) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-semibold"
                      >
                        Voluntário
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('hours')}
                        className="h-auto p-0 font-semibold"
                      >
                        Horas
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteerHours && filteredVolunteerHours.length > 0 ? (
                    filteredVolunteerHours.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.activity}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {(() => {
                              const hours = typeof item.hours === 'string' ? parseFloat(item.hours) : item.hours;
                              return isNaN(hours) ? '0' : hours.toString();
                            })()}h
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.description ? (
                            <p className="text-sm text-muted-foreground max-w-xs truncate">
                              {item.description}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhum registro encontrado.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Contador de resultados */}
            {filteredVolunteerHours && filteredVolunteerHours.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Mostrando {filteredVolunteerHours.length} registro{filteredVolunteerHours.length !== 1 ? 's' : ''}
                {selectedVolunteer && selectedVolunteer !== 'all' && ` do voluntário "${uniqueVolunteersList.find(v => v.value === selectedVolunteer)?.label}"`}
                {searchTerm && selectedVolunteer === 'all' && ` para "${searchTerm}"`}
                {(selectedVolunteer !== 'all' || searchTerm) && ` (de ${volunteerHours?.length || 0} total)`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 