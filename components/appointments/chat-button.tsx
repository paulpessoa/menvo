'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface ChatButtonProps {
    appointment: {
        id: string;
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
                <DialogContent className="max-w-2xl max-h-[80vh] p-0">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>
                            Chat com {otherPerson.full_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        <ChatInterface
                            mentorId={appointment.mentor.id}
                            currentUserId={currentUserId}
                            mentorName={appointment.mentor.full_name}
                            mentorAvatar={appointment.mentor.avatar_url}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
