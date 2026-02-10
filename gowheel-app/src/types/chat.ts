// Chat types — mirrors the website exactly

export interface Conversation {
    id: string;
    booking_id: string;
    renter_id: string;
    owner_id: string;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_text: string;
    read_at?: string | null;
    created_at: string;
}

export interface MessageWithSender extends Message {
    sender?: { id: string; full_name: string };
}

export const CHAT_ENABLED_STATUSES = ['approved', 'confirmed', 'completed'] as const;

export function isChatEnabled(bookingStatus: string): boolean {
    return CHAT_ENABLED_STATUSES.includes(bookingStatus as (typeof CHAT_ENABLED_STATUSES)[number]);
}
