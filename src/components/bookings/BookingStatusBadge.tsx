'use client';

import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types/booking';

interface BookingStatusBadgeProps {
    status: BookingStatus;
    variant?: 'renter' | 'owner';
    size?: 'sm' | 'default';
}

const statusConfig: Record<BookingStatus, {
    renterLabel: string;
    ownerLabel: string;
    className: string;
    icon: string;
}> = {
    requested: {
        renterLabel: 'Pending approval',
        ownerLabel: 'New request',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: '⏳',
    },
    approved: {
        renterLabel: 'Approved – awaiting payment',
        ownerLabel: 'Approved',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: '✅',
    },
    confirmed: {
        renterLabel: 'Confirmed – Paid',
        ownerLabel: 'Confirmed – Paid',
        className: 'bg-primary/10 text-primary border-primary/20',
        icon: '🎉',
    },
    rejected: {
        renterLabel: 'Request rejected',
        ownerLabel: 'Rejected',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: '❌',
    },
    cancelled: {
        renterLabel: 'Cancelled',
        ownerLabel: 'Cancelled by renter',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        icon: '🚫',
    },
};

export default function BookingStatusBadge({ status, variant = 'renter', size = 'default' }: BookingStatusBadgeProps) {
    const config = statusConfig[status];
    const label = variant === 'renter' ? config.renterLabel : config.ownerLabel;

    return (
        <Badge
            variant="outline"
            className={`${config.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-2.5 py-1'}`}
        >
            <span className="mr-1">{config.icon}</span>
            {label}
        </Badge>
    );
}
