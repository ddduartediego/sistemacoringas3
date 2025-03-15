import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Atualiza a sessão do Supabase e gerencia os cookies
 * Esta função é usada no middleware do Next.js para gerenciar a autenticação
 */
export async function updateSession(request: NextRequest) {
  // Criar uma resposta vazia que será modificada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Criar um cliente Supabase usando o request e response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Configurar o cookie tanto no request quanto no response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          // Remover o cookie tanto do request quanto do response
          request.cookies.delete(name);
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          response.cookies.delete(name);
        },
      },
    }
  );

  // IMPORTANTE: Sempre verificar o usuário com getUser() no servidor
  // getSession() não é garantido para revalidar o token de autenticação
  const { data } = await supabase.auth.getUser();

  return response;
} 