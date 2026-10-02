
'use client';

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Search, Loader2 } from "lucide-react";
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Tables } from '@/lib/types/supabase';
import { useAuth } from '@/lib/auth';

// Tipagem baseada nos tipos do Supabase
type FeatureFlag = Tables<'feature_flags'>;
type AuditLog = Tables<'feature_flag_audit_logs'>;

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; name: string; currentStatus: boolean } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '', tags: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) throw new Error('Failed to fetch data');
      const { flags, logs } = await response.json();
      setFlags(flags || []);
      setLogs(logs || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = async () => {
    if (!confirmToggle) return;
    const { id, name, currentStatus } = confirmToggle;
    
    setSaving(id);
    try {
      const newStatus = !currentStatus;
      
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          enabled: newStatus,
          name,
          performed_by: user?.email || 'Sistema'
        })
      });

      if (!response.ok) throw new Error('Failed to update flag');

      toast.success(`Flag ${name} ${newStatus ? 'ativada' : 'desativada'}!`);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setSaving(null);
      setConfirmToggle(null);
    }
  };

  const createFlag = async () => {
    if (!newFlag.name) return toast.error('Nome é obrigatório');
    
    setIsCreating(true);
    try {
      const tagArray = newFlag.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlag.name,
          description: newFlag.description,
          tags: tagArray
        })
      });

      if (!response.ok) throw new Error('Failed to create flag');
      
      toast.success('Feature Flag criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewFlag({ name: '', description: '', tags: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao criar flag: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteFlag = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a flag ${name}?`)) return;
    
    try {
      const response = await fetch(`/api/admin/feature-flags?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete flag');
      
      toast.success('Flag removida.');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allTags = Array.from(new Set(flags.flatMap(f => f.tags ?? []))).sort();

  const filteredFlags = flags.filter((flag) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      flag.name.toLowerCase().includes(query) ||
      (flag.description || '').toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'enabled' ? flag.enabled : !flag.enabled);
    const matchesTag = tagFilter === 'all' || (flag.tags ?? []).includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  });

  return (
    <PageContainer>
      <AdminPageHeader
        title="Feature flags"
        description="Ligue e desligue funcionalidades em tempo real, sem deploy."
        actions={
          <>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Nova flag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Feature Flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Flag (SNAKE_CASE)</Label>
                  <Input 
                    placeholder="EX: NOVO_ALGORITMO" 
                    value={newFlag.name}
                    onChange={e => setNewFlag({...newFlag, name: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={newFlag.description}
                    onChange={e => setNewFlag({...newFlag, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (vírgula)</Label>
                  <Input 
                    value={newFlag.tags}
                    onChange={e => setNewFlag({...newFlag, tags: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={createFlag} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 animate-spin h-4 w-4" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Flags</h2>

          {flags.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou descrição..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="enabled">Ativas</SelectItem>
                  <SelectItem value="disabled">Inativas</SelectItem>
                </SelectContent>
              </Select>
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20 bg-muted/10 rounded-xl border border-dashed"><MenvoDots /></div>
          ) : filteredFlags.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              {flags.length === 0 ? 'Nenhuma feature flag criada ainda.' : 'Nenhuma flag encontrada para esse filtro.'}
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredFlags.map((flag) => (
                <Card key={flag.id} className={flag.enabled ? 'border-primary/40 bg-primary/5 shadow-sm' : 'opacity-80'}>
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-mono">{flag.name}</CardTitle>
                          <Badge variant={flag.enabled ? 'default' : 'outline'}>{flag.enabled ? 'Ativa' : 'Inativa'}</Badge>
                        </div>
                        <CardDescription className="text-sm">{flag.description}</CardDescription>
                      </div>
                      <Switch 
                        checked={flag.enabled ?? false} 
                        onCheckedChange={() => setConfirmToggle({ id: flag.id, name: flag.name, currentStatus: flag.enabled ?? false })}
                        disabled={saving === flag.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 py-2">
                    <div className="flex flex-wrap gap-1">
                      {flag.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                    </div>
                  </CardContent>
                  <CardFooter className="px-5 py-3 border-t bg-muted/5 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Atualizado em: {new Date(flag.updated_at ?? '').toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-red-600" onClick={() => deleteFlag(flag.id, flag.name)}>
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico de alterações</h2>
          <Card>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                {logs.map(log => (
                <div key={log.id} className="p-3 border-b last:border-0">
                    <div className="mb-1">
                    <span className="text-[11px] font-bold font-mono">{log.flag_name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{log.action} por {log.performed_by}</p>
                    <span className="text-[9px] opacity-60">{new Date(log.created_at ?? '').toLocaleString()}</span>
                </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração</AlertDialogTitle>
            <AlertDialogDescription>Deseja {confirmToggle?.currentStatus ? 'DESATIVAR' : 'ATIVAR'} a flag {confirmToggle?.name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
