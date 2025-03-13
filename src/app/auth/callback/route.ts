import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Esta configuração é necessária para routes handlers em Next.js
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extrair parâmetros da URL
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (!code) {
      console.error('Nenhum código recebido na callback');
      return NextResponse.redirect(`${origin}/login?error=auth-callback-missing-code`);
    }

    // Criar cliente Supabase de forma assíncrona
    const supabase = await createRouteHandlerSupabase();
    
    // Trocar o código por uma sessão
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Erro ao trocar código por sessão:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth-callback-exchange-failed`);
    }
    
    // Redirecionamento bem-sucedido
    console.log('Troca de código por sessão bem-sucedida, redirecionando para:', next);
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Erro não tratado na callback:', error);
    return NextResponse.redirect(`${origin}/login?error=auth-callback-unknown-error`);
  }
} 