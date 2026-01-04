'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_SECURITY_DEPOSIT_TEXT } from '@/types/rideInspection';

interface SecurityDepositInfoProps {
    /** Custom security deposit text from vehicle owner */
    securityDepositText?: string | null;
    /** Variant display style */
    variant?: 'card' | 'inline' | 'compact';
    /** Optional class name */
    className?: string;
}

/**
 * Displays security deposit information for a vehicle.
 * Shows custom text if provided by owner, otherwise shows default text.
 */
export default function SecurityDepositInfo({
    securityDepositText,
    variant = 'card',
    className = '',
}: SecurityDepositInfoProps) {
    const displayText = securityDepositText || DEFAULT_SECURITY_DEPOSIT_TEXT;
    const isCustom = !!securityDepositText;

    // Compact variant - just a badge with tooltip
    if (variant === 'compact') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge 
                            variant="secondary" 
                            className={`bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-help ${className}`}
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Security Deposit
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{displayText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Inline variant - simple text display
    if (variant === 'inline') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 ${className}`}
            >
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-400 mb-0.5">Security Deposit</p>
                        <p className="text-sm text-muted-foreground">{displayText}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Card variant - full display with header
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <Card className={`bg-card/50 border-border/50 overflow-hidden ${className}`}>
                <CardHeader className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-b border-border/50 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            Security Deposit Terms
                        </CardTitle>
                        {isCustom && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                Owner Specified
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                        {displayText}
                    </p>

                    {/* Key points */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Points</p>
                        <ul className="space-y-1.5">
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Collect deposit in cash before starting the ride</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Document vehicle condition with inspection photos</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Refund deposit after verifying vehicle condition</span>
                            </li>
                        </ul>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Security deposit is handled directly between owner and renter
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
