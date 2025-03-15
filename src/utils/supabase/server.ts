import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cria um cliente Supabase para componentes do lado do servidor
 * Esta função deve ser usada em Server Components, Server Actions e Route Handlers
 */
export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.delete(name, options);
        },
      },
    }
  );
} 