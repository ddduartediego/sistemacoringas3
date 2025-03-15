import { createBrowserClient } from '@supabase/ssr';

/**
 * Cria um cliente Supabase para componentes do lado do cliente
 * Esta função deve ser usada em componentes que executam no navegador
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} 