import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, X, CheckCircle } from 'lucide-react'

interface AppointmentStatusBadgeProps {
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    className?: string
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
    const statusConfig = {
        pending: {
            label: 'Pendente',
            variant: 'secondary' as const,
            icon: Clock,
            className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        },
        confirmed: {
            label: 'Confirmado',
            variant: 'default' as const,
            icon: CheckCircle,
            className: 'bg-green-100 text-green-800 border-green-200',
        },
        cancelled: {
            label: 'Cancelado',
            variant: 'destructive' as const,
            icon: X,
            className: 'bg-red-100 text-red-800 border-red-200',
        },
        completed: {
            label: 'Concluído',
            variant: 'outline' as const,
            icon: Calendar,
            className: 'bg-blue-100 text-blue-800 border-blue-200',
        },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <Badge
            variant={config.variant}
            className={`${config.className} ${className}`}
        >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
        </Badge>
    )
}
