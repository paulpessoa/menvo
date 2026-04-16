'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface ChatButtonProps {
    appointment: {
        id: string | number;
        mentor: {
            id: string;
            full_name: string;
            avatar_url?: string;
        };
        mentee: {
            id: string;
            full_name: string;
            avatar_url?: string;
        };
    };
    currentUserId: string;
    isMentor: boolean;
}

export function ChatButton({ appointment, currentUserId, isMentor }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const otherPerson = isMentor ? appointment.mentee : appointment.mentor;

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <MessageSquare className="w-4 h-4" />
                Chat
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                    {/* 
                      Forçamos o remount do ChatInterface toda vez que o modal abre
                      usando isOpen no key, além de garantir que o ID seja o da outra pessoa.
                    */}
                    {isOpen && (
                        <ChatInterface
                            key={`${otherPerson.id}-${appointment.id}-${isOpen}`}
                            mentorId={otherPerson.id}
                            currentUserId={currentUserId}
                            mentorName={otherPerson.full_name}
                            mentorAvatar={otherPerson.avatar_url}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
