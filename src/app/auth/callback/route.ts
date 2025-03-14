import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Esta configuração é necessária para routes handlers em Next.js
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Iniciando processamento da callback de autenticação');
    
    // Extrair parâmetros da URL
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    console.log('Parâmetros de callback recebidos:', { 
      temCodigo: !!code, 
      destinoAposLogin: next 
    });

    if (!code) {
      console.error('Nenhum código recebido na callback');
      return NextResponse.redirect(`${origin}/login?error=auth-callback-missing-code`);
    }

    try {
      // Criar cliente Supabase de forma assíncrona
      console.log('Criando cliente Supabase para processamento de código de autenticação');
      const supabase = await createRouteHandlerSupabase();
      
      // Trocar o código por uma sessão
      console.log('Trocando código por sessão no Supabase');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Erro ao trocar código por sessão:', error.message);
        return NextResponse.redirect(`${origin}/login?error=auth-callback-exchange-failed&message=${encodeURIComponent(error.message)}`);
      }
      
      console.log('Sessão criada com sucesso:', {
        temSessao: !!data?.session,
        expiraEm: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'desconhecido'
      });
      
      // Redirecionamento bem-sucedido
      console.log('Troca de código por sessão bem-sucedida, redirecionando para:', next);
      
      // Adicionar um pequeno atraso para garantir que os cookies sejam definidos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return NextResponse.redirect(`${origin}${next}`);
    } catch (innerError: any) {
      console.error('Erro durante processamento da autenticação:', innerError);
      return NextResponse.redirect(`${origin}/login?error=auth-processing-error&message=${encodeURIComponent(innerError?.message || 'Erro desconhecido')}`);
    }
  } catch (error: any) {
    console.error('Erro não tratado na callback:', error);
    return NextResponse.redirect(`${origin}/login?error=auth-callback-unknown-error&message=${encodeURIComponent(error?.message || 'Erro desconhecido')}`);
  }
} 