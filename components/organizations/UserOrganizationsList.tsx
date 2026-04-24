
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Settings, Loader2, ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserOrg {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  role: 'admin' | 'moderator' | 'mentor' | 'mentee' | 'member';
  status: 'active' | 'invited' | 'pending';
  expires_at: string | null;
}

export function UserOrganizationsList() {
  const [orgs, setOrgs] = useState<UserOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const fetchMyOrgs = async () => {
    try {
      const response = await fetch('/api/profile/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrgs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching my orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrgs();
  }, []);

  const handleLeave = async (orgId: string, membershipId: string, orgName: string) => {
    if (!confirm(`Tem certeza que deseja sair da organização ${orgName}?`)) return;

    setLeavingId(membershipId);
    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${membershipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Você saiu da organização ${orgName}`);
        setOrgs(prev => prev.filter(o => o.id !== membershipId));
      } else {
        throw new Error('Falha ao sair da organização');
      }
    } catch (error) {
      toast.error('Erro ao processar sua saída. Tente novamente.');
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  if (orgs.length === 0) return null;

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Minhas Organizações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y">
        {orgs.map((item) => (
          <div key={item.organization.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
                {item.organization.logo_url ? (
                  <img src={item.organization.logo_url} alt={item.organization.name} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">{item.organization.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                    {item.role === 'admin' ? 'Administrador' : item.role === 'moderator' ? 'Moderador' : item.role}
                  </Badge>
                  {item.status === 'invited' && <Badge className="text-[10px] h-4 px-1.5 bg-yellow-500">Pendente</Badge>}
                  {item.expires_at && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Até {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.role === 'admin' && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" asChild title="Gerenciar Organização">
                  <Link href={`/organizations/${item.organization.slug}/dashboard`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-destructive hover:bg-red-50" 
                onClick={() => handleLeave(item.organization.id, item.id, item.organization.name)}
                disabled={leavingId === item.id}
                title="Sair da Organização"
              >
                {leavingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" asChild title="Ver Página">
                <Link href={`/organizations/${item.organization.slug}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
