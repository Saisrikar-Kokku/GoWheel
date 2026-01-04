import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Health check function to verify Supabase connection
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    // Attempt a simple query to verify connection
    const { error } = await supabase.from('_health_check').select('*').limit(1);
    
    // Even if table doesn't exist, connection is still valid
    // We check if the error is NOT a connection error
    if (error && error.message.includes('Failed to fetch')) {
      return {
        connected: false,
        message: 'Unable to connect to Supabase. Check your network connection.',
      };
    }
    
    return {
      connected: true,
      message: 'Successfully connected to Supabase!',
    };
  } catch (err) {
    return {
      connected: false,
      message: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
