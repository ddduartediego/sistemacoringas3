import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function createRouteHandlerSupabase() {
  const cookieStore = cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
} 