import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Esta configuração é necessária para routes handlers em Next.js
export const dynamic = 'force-dynamic';

/**
 * Rota de callback para autenticação
 * Esta rota é chamada após o usuário autenticar com um provedor externo
 * 
 * O código na URL é trocado por uma sessão e o usuário é redirecionado
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    console.log('Callback: Code recebido, trocando por sessão');
    
    // Obter error e next da URL se estiverem presentes
    const error = requestUrl.searchParams.get('error');
    const next = requestUrl.searchParams.get('next') || '/dashboard';
    
    // Se houver um erro no login, redirecionar para /login com o erro
    if (error) {
      console.error('Callback: Erro recebido no callback:', error);
      // Codificar o erro para passar na URL de forma segura
      const encodedError = encodeURIComponent(error);
      // Redirecionar para o login com o erro
      return NextResponse.redirect(new URL(`/login?error=${encodedError}`, requestUrl.origin));
    }
    
    try {
      // Criar cliente Supabase usando o novo método
      const supabase = await createClient();
      
      // Executar a troca do code por uma sessão
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Callback: Erro ao trocar code por sessão:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Falha na autenticação')}`, requestUrl.origin)
        );
      }
      
      console.log('Callback: Code trocado por sessão com sucesso, redirecionando para:', next);
      
      // Redirecionar para a página especificada ou para o dashboard por padrão
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      console.error('Callback: Erro não tratado no processo de callback:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Erro interno no servidor')}`, requestUrl.origin)
      );
    }
  }
  
  // Se não houver code, redirecionar para /login
  console.error('Callback: Nenhum código recebido no callback');
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
} 