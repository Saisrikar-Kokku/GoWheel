import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing! Check your .env file or EAS production secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export async function checkSupabaseConnection(): Promise<{
    connected: boolean;
    message: string;
}> {
    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && error.message.includes('Failed to fetch')) {
            return { connected: false, message: 'Unable to connect to Supabase.' };
        }
        return { connected: true, message: 'Connected!' };
    } catch (err) {
        return {
            connected: false,
            message: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}
