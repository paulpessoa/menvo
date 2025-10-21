'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MentorChatToggleProps {
    mentorId: string;
    initialValue: boolean;
}

export function MentorChatToggle({ mentorId, initialValue }: MentorChatToggleProps) {
    const [chatEnabled, setChatEnabled] = useState(initialValue);
    const [updating, setUpdating] = useState(false);

    const handleToggle = async (enabled: boolean) => {
        setUpdating(true);

        try {
            const response = await fetch('/api/mentors/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatEnabled: enabled,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar configuração');
            }

            setChatEnabled(enabled);
            toast.success(
                enabled ? 'Chat habilitado com sucesso!' : 'Chat desabilitado com sucesso!'
            );
        } catch (error) {
            console.error('[SETTINGS] Erro ao atualizar chat:', error);
            toast.error('Erro ao atualizar configuração');
            // Reverter o estado
            setChatEnabled(!enabled);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat em Tempo Real
                </CardTitle>
                <CardDescription>
                    Permita que mentorandos iniciem conversas em tempo real com você
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="chat-toggle" className="text-base">
                            Habilitar Chat
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {chatEnabled
                                ? 'Mentorandos podem enviar mensagens instantâneas'
                                : 'Chat desabilitado - use apenas agendamentos'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Switch
                            id="chat-toggle"
                            checked={chatEnabled}
                            onCheckedChange={handleToggle}
                            disabled={updating}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
