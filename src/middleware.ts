import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Função auxiliar para verificar se uma string corresponde a um valor específico ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string | undefined | null, str2: string): boolean {
  if (!str1) return false;
  return str1.toLowerCase() === str2.toLowerCase();
}

export async function middleware(req: NextRequest) {
  try {
    console.log('Middleware executando para:', req.nextUrl.pathname);
    
    // Tratamento especial para a rota de callback para evitar erros de API de cookies
    if (req.nextUrl.pathname === '/auth/callback') {
      console.log('Rota de callback detectada, permitindo passagem direta sem operações de cookies');
      // Simplesmente permitir a passagem sem tentar criar o cliente Supabase
      return NextResponse.next();
    }

    // Verificar se há um parâmetro de logout
    const isLogout = req.nextUrl.searchParams.get('logout') === 'true';
    if (isLogout) {
      console.log('Parâmetro de logout detectado, permitindo redirecionamento sem verificação');
      // Remover o parâmetro de logout da URL antes de prosseguir
      const cleanUrl = new URL(req.url);
      cleanUrl.searchParams.delete('logout');
      return NextResponse.redirect(cleanUrl);
    }
    
    // Atualizar a sessão
    const res = await updateSession(req);
    
    // Usar uma forma mais segura para obter o usuário autenticado
    // O novo middleware supabase já executa getUser() para nós
    const authRedirectPaths = ['/dashboard', '/profile', '/admin'];
    const publicPaths = ['/', '/login', '/register'];

    // Obter o path da URL
    const path = req.nextUrl.pathname;
    
    // Verificar se está tentando acessar uma rota protegida
    const isAuthPath = authRedirectPaths.some(authPath => path.startsWith(authPath));
    const isPublicPath = publicPaths.some(publicPath => 
      path === publicPath || path.startsWith(publicPath + '/')
    );
    
    // Verificar cookies para determinação básica de autenticação
    // NOTA: Esta é uma verificação BÁSICA. A verificação real de autenticação
    // já foi feita pelo updateSession acima
    const hasAuthCookie = req.cookies.has('sb-access-token') || 
                         req.cookies.has('sb-refresh-token');
    
    if (!hasAuthCookie && isAuthPath) {
      // Redirecionar para login se não estiver autenticado e tentar acessar rota protegida
      console.log('Redirecionando para login (não autenticado)');
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Continuar com a resposta atualizada
    return res;
  } catch (error) {
    console.error('Erro no middleware:', error);
    // Em caso de erro inesperado, é melhor prosseguir para a rota e deixar 
    // a aplicação decidir como lidar com questões de autenticação
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/auth/callback',
    '/dashboard/:path*', 
    '/profile/:path*', 
    '/admin/:path*',
    '/login', 
    '/register',
    '/pending-approval'
  ],
}; 