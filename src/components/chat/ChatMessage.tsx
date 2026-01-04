'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
    message: string;
    senderName: string;
    timestamp: string;
    isOwn: boolean;
    isOptimistic?: boolean;
    isRead?: boolean;
}

export default function ChatMessage({
    message,
    senderName,
    timestamp,
    isOwn,
    isOptimistic = false,
    isRead = false,
}: ChatMessageProps) {
    const formattedTime = format(new Date(timestamp), 'h:mm a');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex flex-col max-w-[80%]',
                isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
            )}
        >
            {/* Sender name */}
            <span className="text-xs text-muted-foreground mb-1 px-1">
                {isOwn ? 'You' : senderName}
            </span>

            {/* Message bubble */}
            <div
                className={cn(
                    'px-4 py-2.5 rounded-2xl max-w-full break-words',
                    isOwn
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md'
                        : 'bg-muted/50 text-foreground rounded-bl-md border border-border/50'
                )}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            </div>

            {/* Timestamp and Seen status */}
            <div className={cn(
                'flex items-center gap-1.5 mt-1 px-1',
                isOptimistic && 'italic'
            )}>
                <span className="text-[10px] text-muted-foreground">
                    {isOptimistic ? 'Sending...' : formattedTime}
                </span>

                {/* Seen indicator - only show for own messages */}
                {isOwn && !isOptimistic && (
                    <span className={cn(
                        'text-[10px] flex items-center gap-0.5',
                        isRead ? 'text-emerald-400' : 'text-muted-foreground'
                    )}>
                        {isRead ? (
                            <>
                                {/* Double check mark for seen */}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <svg className="w-3 h-3 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-0.5">Seen</span>
                            </>
                        ) : (
                            <>
                                {/* Single check mark for sent */}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </>
                        )}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
