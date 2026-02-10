import { supabase } from '@/lib/supabase';

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'ride_started' | 'ride_completed' | 'payment_received' | 'general';
    data: Record<string, any>;
    read: boolean;
    created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

export async function getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

    if (error) return 0;
    return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) throw error;
}

export function subscribeToNotifications(
    userId: string,
    callback: (notification: AppNotification) => void
) {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                callback(payload.new as AppNotification);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
