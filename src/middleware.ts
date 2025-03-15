import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

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
    
    // Para todas as outras rotas, continue normalmente
    const res = NextResponse.next();
    
    // Criar o cliente Supabase de forma assíncrona
    // Correção: Usar a forma correta para Next.js 15
    const supabase = createMiddlewareClient({ 
      req, 
      res
    });
    
    try {
      // Obter a sessão de forma assíncrona
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;

      if (error) {
        console.error('Erro ao obter sessão no middleware:', error);
      }

      console.log('Status de autenticação:', {
        pathname: req.nextUrl.pathname,
        hasSession: !!session,
        userEmail: session?.user?.email || 'não autenticado'
      });

      // Se não tem sessão, aplica as regras para usuários não autenticados
      if (!session) {
        // Se estiver acessando uma rota protegida e não estiver autenticado,
        // redireciona para a página de login
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/profile') ||
            req.nextUrl.pathname.startsWith('/admin')) {
          console.log('Redirecionando para login (não autenticado)');
          return NextResponse.redirect(new URL('/login', req.url));
        }
        
        // Continue para outras rotas (públicas)
        return res;
      }
      
      // Se tem sessão (está autenticado), verifica se é um membro aprovado ou inativo
      if (session?.user?.id) {
        console.log('Verificando status do membro:', session.user.id);
        
        // Consultar o tipo de membro de forma assíncrona
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', session.user.id)
          .single();
        
        if (memberError) {
          console.error('Erro ao verificar membro:', memberError);
          // Se não conseguir verificar, considere como não tendo permissão (segurança)
          if (req.nextUrl.pathname.startsWith('/dashboard') || 
              req.nextUrl.pathname.startsWith('/profile') ||
              req.nextUrl.pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/pending-approval', req.url));
          }
        }
        
        // Verificações case-insensitive para tipos de membro
        const isApproved = memberData && (
          equalsIgnoreCase(memberData.type, 'member') || 
          equalsIgnoreCase(memberData.type, 'admin')
        );
        const isAdmin = memberData && equalsIgnoreCase(memberData.type, 'admin');
        const isMember = memberData && equalsIgnoreCase(memberData.type, 'member');
        
        console.log('Status do membro:', {
          type: memberData?.type || 'desconhecido',
          isApproved,
          isAdmin,
          isMember
        });
        
        // Se está acessando uma rota protegida, mas é um membro inativo,
        // redireciona para página de aprovação pendente
        if (!isApproved && 
           (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/profile'))) {
          console.log('Redirecionando para página de aprovação pendente (membro inativo)');
          return NextResponse.redirect(new URL('/pending-approval', req.url));
        }
        
        // Se está acessando uma rota de admin, mas não é admin,
        // redireciona para dashboard ou perfil dependendo do tipo
        if (!isAdmin && req.nextUrl.pathname.startsWith('/admin')) {
          console.log('Redirecionando para seção apropriada (acesso de admin negado)');
          const redirectUrl = isMember ? '/profile' : '/dashboard';
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
        
        // Se está tentando acessar a página de aprovação pendente, mas já é um membro aprovado,
        // redireciona para o dashboard ou perfil dependendo do tipo
        if (isApproved && req.nextUrl.pathname.startsWith('/pending-approval')) {
          console.log('Redirecionando de aprovação pendente para seção apropriada');
          const redirectUrl = isMember ? '/profile' : '/dashboard';
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
        
        // Se está tentando acessar a página inicial, login ou registro estando logado,
        // redirecionar para o dashboard ou perfil dependendo do tipo
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register')) {
          console.log('Usuário autenticado tentando acessar página pública');
          const redirectUrl = isMember ? '/profile' : '/dashboard';
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
        
        // Se é um usuário do tipo member tentando acessar o dashboard,
        // redirecionar para o perfil
        if (isMember && req.nextUrl.pathname.startsWith('/dashboard')) {
          console.log('Membro regular tentando acessar dashboard, redirecionando para perfil');
          return NextResponse.redirect(new URL('/profile', req.url));
        }
      }

      // Se estiver tentando acessar rotas de autenticação, mas já estiver autenticado,
      // redireciona para o dashboard ou para a página de aprovação pendente
      if ((req.nextUrl.pathname.startsWith('/login') || 
           req.nextUrl.pathname.startsWith('/register')) && 
           session) {
        console.log('Redirecionando de login/registro (já autenticado)');
        
        // Verificar se é membro aprovado para determinar para onde redirecionar
        const { data: memberData } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', session.user.id)
          .single();
        
        // Verificações case-insensitive para tipos de membro
        const isApproved = memberData && (
          equalsIgnoreCase(memberData.type, 'member') || 
          equalsIgnoreCase(memberData.type, 'admin')
        );
        const isMember = memberData && equalsIgnoreCase(memberData.type, 'member');
        
        if (isApproved) {
          const redirectUrl = isMember ? '/profile' : '/dashboard';
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        } else {
          return NextResponse.redirect(new URL('/pending-approval', req.url));
        }
      }
    } catch (sessionError) {
      console.error('Erro ao processar sessão no middleware:', sessionError);
      // Em caso de erro na sessão, permitir o acesso a rotas públicas
      if (req.nextUrl.pathname.startsWith('/dashboard') || 
          req.nextUrl.pathname.startsWith('/profile') ||
          req.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    console.log('Middleware concluído para:', req.nextUrl.pathname);
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