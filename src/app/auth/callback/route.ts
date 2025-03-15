import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Esta configuração é necessária para routes handlers em Next.js
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Callback: Iniciando processamento da callback de autenticação');
    
    // Extrair parâmetros da URL
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    console.log('Callback: Parâmetros recebidos:', { 
      temCodigo: !!code, 
      destinoAposLogin: next 
    });

    if (!code) {
      console.error('Callback: Nenhum código recebido na callback');
      return NextResponse.redirect(`${origin}/login?error=auth-callback-missing-code`);
    }

    try {
      // Criar cliente Supabase de forma assíncrona
      console.log('Callback: Criando cliente Supabase para processamento de código de autenticação');
      const supabase = await createRouteHandlerSupabase();
      
      // Trocar o código por uma sessão
      console.log('Callback: Trocando código por sessão no Supabase');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Callback: Erro ao trocar código por sessão:', error.message);
        return NextResponse.redirect(`${origin}/login?error=auth-callback-exchange-failed&message=${encodeURIComponent(error.message)}`);
      }
      
      console.log('Callback: Sessão criada com sucesso:', {
        temSessao: !!data?.session,
        expiraEm: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'desconhecido'
      });
      
      // Redirecionamento bem-sucedido
      console.log('Callback: Troca de código por sessão bem-sucedida, redirecionando para:', next);
      
      // Não é mais necessário adicionar um atraso, pois estamos usando a API corretamente
      return NextResponse.redirect(`${origin}${next}`);
    } catch (innerError: any) {
      console.error('Callback: Erro durante processamento da autenticação:', innerError);
      return NextResponse.redirect(`${origin}/login?error=auth-processing-error&message=${encodeURIComponent(innerError?.message || 'Erro desconhecido')}`);
    }
  } catch (error: any) {
    console.error('Callback: Erro não tratado na callback:', error);
    return NextResponse.redirect(`${origin}/login?error=auth-callback-unknown-error&message=${encodeURIComponent(error?.message || 'Erro desconhecido')}`);
  }
} 