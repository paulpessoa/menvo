
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Save } from 'lucide-react';

interface FeatureFlag {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const supabase = createClient();

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setFlags(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar flags: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (id: number, currentStatus: boolean) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setFlags(flags.map(f => f.id === id ? { ...f, enabled: !currentStatus } : f));
      toast.success('Flag atualizada com sucesso!');
      
      // Forçar atualização do cache local do sistema de flags
      await fetch('/api/feature-flags', { method: 'GET' });
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Controle as funcionalidades do MENVO em tempo real.</p>
        </div>
        <Button variant="outline" onClick={fetchFlags} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {flags.length === 0 && (
            <p className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">Nenhuma flag encontrada no banco de dados.</p>
          )}
          {flags.map((flag) => (
            <Card key={flag.id} className={flag.enabled ? 'border-primary/50 bg-primary/5' : ''}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-mono">{flag.name}</CardTitle>
                    <CardDescription>{flag.description || 'Sem descrição.'}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {saving === flag.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch 
                      id={`flag-${flag.id}`} 
                      checked={flag.enabled} 
                      onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                      disabled={saving === flag.id}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <p><strong>Nota técnica:</strong> Estas alterações refletem imediatamente no banco de dados. Os usuários podem levar até alguns segundos para ver a mudança devido ao cache do navegador ou SWR.</p>
      </div>
    </div>
  );
}
