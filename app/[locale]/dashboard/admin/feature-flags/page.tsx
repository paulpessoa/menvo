
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Loader2, RefreshCw, Save, Plus, Trash2, History, Tag, 
  AlertTriangle, CheckCircle2, XCircle, Info
} from 'lucide-react';
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

interface FeatureFlag {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
  tags: string[];
  updated_at: string;
}

interface AuditLog {
  id: number;
  flag_name: string;
  action: string;
  performed_by: string;
  created_at: string;
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  
  // States para Confirmação
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; name: string; currentStatus: boolean } | null>(null);
  
  // States para CRUD
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '', tags: '' });
  const [isCreating, setIsCreateing] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: flagsData, error: flagsError } = await (supabase
        .from('feature_flags' as any)
        .select('*')
        .order('name') as any);
      
      if (flagsError) throw flagsError;
      setFlags(flagsData || []);

      const { data: logsData, error: logsError } = await (supabase
        .from('feature_flag_audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20) as any);
      
      if (logsError) throw logsError;
      setLogs(logsData || []);

    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;
    const { id, name, currentStatus } = confirmToggle;
    
    setSaving(id);
    try {
      const newStatus = !currentStatus;
      
      // 1. Atualizar flag
      const { error: updateError } = await (supabase
        .from('feature_flags' as any)
        .update({ 
          enabled: newStatus, 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', id) as any);

      if (updateError) throw updateError;
      
      // 2. Gravar Log
      const { data: { user } } = await supabase.auth.getUser();
      await (supabase.from('feature_flag_audit_logs' as any).insert({
        flag_name: name,
        action: newStatus ? 'Ativada' : 'Desativada',
        performed_by: user?.email || 'Sistema'
      }) as any);

      setFlags(flags.map(f => f.id === id ? { ...f, enabled: newStatus } : f));
      toast.success(`Flag ${name} ${newStatus ? 'ativada' : 'desativada'}!`);
      
      // Refresh logs
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
    
    setIsCreateing(true);
    try {
      const tagArray = newFlag.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await (supabase
        .from('feature_flags' as any)
        .insert({
          name: newFlag.name,
          description: newFlag.description,
          tags: tagArray,
          enabled: false
        } as any) as any);

      if (error) throw error;
      
      toast.success('Feature Flag criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewFlag({ name: '', description: '', tags: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao criar flag: ' + error.message);
    } finally {
      setIsCreateing(false);
    }
  };

  const deleteFlag = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a flag ${name}?`)) return;
    
    try {
      const { error } = await (supabase.from('feature_flags' as any).delete().eq('id', id) as any);
      if (error) throw error;
      toast.success('Flag removida.');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Governança de Features
          </h1>
          <p className="text-muted-foreground">Gerencie o ciclo de vida e a visibilidade das funcionalidades em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nova Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Feature Flag</DialogTitle>
                <DialogDescription>Adicione uma nova chave de controle ao sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Flag (SNAKE_CASE)</Label>
                  <Input 
                    placeholder="EX: NOVO_ALGORITMO_BUSCA" 
                    value={newFlag.name}
                    onChange={e => setNewFlag({...newFlag, name: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Descreva o impacto desta flag..." 
                    value={newFlag.description}
                    onChange={e => setNewFlag({...newFlag, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input 
                    placeholder="UI, Mentor, Mobile" 
                    value={newFlag.tags}
                    onChange={e => setNewFlag({...newFlag, tags: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={createFlag} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Flag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Listagem de Flags */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Flags Ativas
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-20 bg-muted/10 rounded-xl border border-dashed">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {flags.length === 0 && (
                <div className="text-center py-20 bg-muted/5 rounded-xl border-2 border-dashed">
                  <p className="text-muted-foreground">Nenhuma feature flag configurada.</p>
                </div>
              )}
              {flags.map((flag) => (
                <Card key={flag.id} className={`transition-all ${flag.enabled ? 'border-primary/40 bg-primary/5 shadow-sm' : 'opacity-80'}`}>
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-mono tracking-tight">{flag.name}</CardTitle>
                          {flag.enabled ? 
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Ativa</Badge> : 
                            <Badge variant="outline" className="text-muted-foreground">Inativa</Badge>
                          }
                        </div>
                        <CardDescription className="text-sm line-clamp-2">{flag.description || 'Sem descrição definida.'}</CardDescription>
                      </div>
                      <Switch 
                        checked={flag.enabled} 
                        onCheckedChange={() => setConfirmToggle({ id: flag.id, name: flag.name, currentStatus: flag.enabled })}
                        disabled={saving === flag.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 py-2">
                    <div className="flex flex-wrap gap-1">
                      {flag.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] uppercase px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="px-5 py-3 border-t bg-muted/5 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Atualizado em: {new Date(flag.updated_at).toLocaleString()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteFlag(flag.id, flag.name)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remover
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Histórico */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log (Histórico)
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="p-8 text-center text-xs text-muted-foreground italic">Nenhuma atividade registrada.</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        {log.action === 'Ativada' ? 
                          <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                          <XCircle className="h-3 w-3 text-red-500" />
                        }
                        <span className="text-[11px] font-bold font-mono">{log.flag_name}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {log.action} por <strong>{log.performed_by?.split('@')[0]}</strong>
                      </p>
                      <span className="text-[9px] opacity-60 italic">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
             <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[11px] text-blue-700 leading-normal">
               <strong>Dica de Governança:</strong> Use flags para lançamentos graduais. Teste primeiro com seu usuário admin antes de liberar para toda a base.
             </p>
          </div>
        </div>
      </div>

      {/* Alerta de Confirmação */}
      <AlertDialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Alteração
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a <strong>{confirmToggle?.currentStatus ? 'DESATIVAR' : 'ATIVAR'}</strong> a funcionalidade 
              <code className="mx-1 px-1 bg-muted rounded font-mono text-foreground">{confirmToggle?.name}</code>.
              Isso afetará todos os usuários da plataforma instantaneamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggle}
              className={confirmToggle?.currentStatus ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              Sim, Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
