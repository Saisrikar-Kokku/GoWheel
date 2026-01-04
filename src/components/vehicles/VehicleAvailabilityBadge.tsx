'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface VehicleAvailabilityBadgeProps {
    vehicleId: string;
    showTooltip?: boolean;
    className?: string;
}

interface AvailabilityData {
    isAvailable: boolean;
    reason?: 'booked' | 'inactive' | 'not_approved' | 'not_found';
    nextAvailableDate?: string;
    currentBooking?: {
        end_date: string;
        ride_status?: string;
    };
}

export default function VehicleAvailabilityBadge({
    vehicleId,
    showTooltip = true,
    className = '',
}: VehicleAvailabilityBadgeProps) {
    const [availability, setAvailability] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAvailability = async () => {
            try {
                const response = await fetch(`/api/vehicles/${vehicleId}/availability`);
                if (response.ok) {
                    const data = await response.json();
                    setAvailability(data);
                }
            } catch (error) {
                console.error('Error checking availability:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAvailability();
    }, [vehicleId]);

    if (loading) {
        return (
            <Badge variant="secondary" className={`animate-pulse bg-muted ${className}`}>
                Checking...
            </Badge>
        );
    }

    if (!availability) {
        return null;
    }

    if (availability.isAvailable) {
        return (
            <Badge 
                variant="secondary" 
                className={`bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ${className}`}
            >
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Available
            </Badge>
        );
    }

    // Not available - show reason
    const getReasonDisplay = () => {
        switch (availability.reason) {
            case 'booked':
                return {
                    text: 'Booked',
                    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    icon: '🔒',
                    tooltip: availability.nextAvailableDate
                        ? `Available after ${format(new Date(availability.nextAvailableDate), 'MMM d, h:mm a')}`
                        : 'Currently booked',
                };
            case 'inactive':
                return {
                    text: 'Unavailable',
                    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                    icon: '⏸️',
                    tooltip: 'This vehicle is currently not available for booking',
                };
            default:
                return {
                    text: 'Unavailable',
                    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                    icon: '⏸️',
                    tooltip: 'This vehicle is not available',
                };
        }
    };

    const display = getReasonDisplay();

    const badge = (
        <Badge variant="secondary" className={`${display.className} ${className}`}>
            <span className="mr-1">{display.icon}</span>
            {display.text}
        </Badge>
    );

    if (showTooltip) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {badge}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{display.tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return badge;
}

// Simple inline availability indicator
export function AvailabilityDot({ isAvailable }: { isAvailable: boolean }) {
    return (
        <span
            className={`inline-block w-2 h-2 rounded-full ${
                isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            title={isAvailable ? 'Available' : 'Booked'}
        />
    );
}
