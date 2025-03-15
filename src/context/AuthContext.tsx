'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { syncUserProfileAfterLogin } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Criar o cliente Supabase usando a forma recomendada para componentes
  // Correção: Usar a forma correta para Next.js 15
  const supabase = createClientComponentClient();

  // Função para verificar a sessão atual
  const getSession = async () => {
    try {
      console.log('AuthContext: Verificando sessão');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthContext: Erro ao obter sessão:', error.message);
        throw error;
      }
      
      return data.session;
    } catch (err: any) {
      console.error('AuthContext: Erro ao verificar sessão:', err.message);
      return null;
    }
  };

  // Função para verificar e criar membro se necessário
  const checkAndCreateMember = async (user: User) => {
    try {
      console.log('AuthContext: Verificando registro de membro para o usuário:', user.id);
      
      // Verificar se o usuário já tem um registro na tabela members
      const { data: existingMember, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (memberError && memberError.code !== 'PGRST116') {
        console.error('AuthContext: Erro ao verificar membro existente:', memberError);
        return null;
      }
      
      // Se o membro já existe, retornar os dados
      if (existingMember) {
        console.log('AuthContext: Usuário já possui registro de membro:', existingMember.type);
        return existingMember;
      }
      
      // Se não existe, criar um novo registro usando a função auxiliar
      console.log('AuthContext: Usuário não possui registro de membro, criando...');
      const userEmail = user.email || '';
      const userName = user.user_metadata?.name || userEmail.split('@')[0];
      
      try {
        const newMember = await syncUserProfileAfterLogin(user.id, userEmail, userName);
        console.log('AuthContext: Novo membro criado com sucesso');
        return newMember;
      } catch (syncError) {
        console.error('AuthContext: Erro ao criar membro:', syncError);
        return null;
      }
    } catch (error) {
      console.error('AuthContext: Erro ao verificar/criar membro:', error);
      return null;
    }
  };

  // Verificar se estamos na rota de callback após autenticação
  useEffect(() => {
    const checkCallback = async () => {
      if (window.location.pathname === '/auth/callback') {
        console.log('Detectada rota de callback, redirecionando para dashboard...');
        try {
          // Buscar a sessão para verificar se o login foi bem-sucedido
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            console.log('Sessão válida encontrada, redirecionamento será tratado pela página de callback');
            // Não redirecionamos aqui, deixamos a página de callback tratar o redirecionamento
            // com base no tipo de usuário
          } else {
            console.log('Sessão não encontrada após callback, redirecionando para login');
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('Erro ao verificar sessão após callback:', error);
          window.location.href = '/login';
        }
      }
    };
    
    checkCallback();
  }, [supabase]);

  // Efeito para verificar a sessão do usuário ao carregar o componente
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        console.log('AuthContext: Verificando usuário atual');
        
        // Obter a sessão atual
        const session = await getSession();
        
        if (!session) {
          console.log('AuthContext: Nenhuma sessão encontrada');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        console.log('AuthContext: Sessão encontrada, obtendo dados do usuário');
        
        // Obter dados do usuário
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          console.error('AuthContext: Erro ao obter usuário:', userError?.message);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        console.log('AuthContext: Usuário autenticado:', authUser.email);
        
        // Verificar e criar registro de membro se necessário
        await checkAndCreateMember(authUser);
        
        // Atualizar o estado com os dados do usuário
        setUser(authUser);
      } catch (err: any) {
        console.error('AuthContext: Erro ao verificar usuário:', err.message);
        setError(err.message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Verificar o usuário ao montar o componente
    checkUser();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Evento de autenticação detectado:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthContext: Usuário fez login, atualizando estado');
          
          // Verificar e criar registro de membro se necessário
          await checkAndCreateMember(session.user);
          
          // Atualizar o estado com os dados do usuário
          setUser(session.user);
          setIsLoading(false);
          
          // Verificar tipo de membro para redirecionar adequadamente
          await checkMemberTypeAndRedirect(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: Usuário fez logout, limpando estado');
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('AuthContext: Token atualizado, atualizando estado');
          setUser(session.user);
          setIsLoading(false);
        }
      }
    );
    
    // Limpar o listener ao desmontar o componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      console.log('AuthContext: Iniciando login com Google');
      setIsLoading(true);
      setError(null);
      
      // Configurar URL de redirecionamento
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('AuthContext: URL de redirecionamento:', redirectTo);
      
      // Iniciar fluxo de login com Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('AuthContext: Erro ao iniciar login com Google:', error.message);
        throw error;
      }
      
      console.log('AuthContext: Login com Google iniciado, redirecionando...');
      
      // Não precisamos definir o usuário aqui, pois o listener de autenticação
      // irá capturar o evento SIGNED_IN e atualizar o estado
    } catch (error: any) {
      console.error('AuthContext: Erro durante processo de login:', error.message);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Função de logout 
  const signOut = async () => {
    try {
      console.log('AuthContext: Iniciando processo de logout...');
      setIsLoading(true);
      setError(null);
      
      // Chamada para encerrar a sessão no Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Especificando 'local' para limpar apenas o armazenamento local, não todas as sessões do usuário em outros dispositivos
      });
      
      if (error) {
        throw error;
      }
      
      console.log('AuthContext: Logout bem-sucedido. Redirecionando para página inicial...');
      
      // Resetar o estado da aplicação
      setUser(null);
      
      // Adicionar um pequeno atraso antes do redirecionamento para garantir que tudo seja limpo
      setTimeout(() => {
        // Atualizar a página para limpar quaisquer dados de estado que possam estar em memória
        router.refresh();
        
        // Redirecionar para a página principal com parâmetro de logout
        // Isso permite que o middleware saiba que este é um redirecionamento de logout
        window.location.href = '/?logout=true';
      }, 300);
    } catch (error: any) {
      console.error('AuthContext: Erro durante o processo de logout:', error.message);
      setError(`Falha ao fazer logout: ${error.message}`);
      setIsLoading(false);
      
      // Mesmo em caso de erro, tentar redirecionar o usuário
      setTimeout(() => {
        window.location.href = '/?logout=true';
      }, 2000);
    }
  };

  // Verificar tipo de membro para redirecionar adequadamente
  const checkMemberTypeAndRedirect = async (userId: string) => {
    try {
      console.log('AuthContext: Verificando tipo de membro para redirecionamento:', userId);
      
      // Tentativa #1: Verificar diretamente no Supabase
      let member = null;
      try {
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error('AuthContext: Erro ao verificar tipo de membro para redirecionamento:', error);
          throw error;
        }
        
        member = data;
      } catch (supabaseError) {
        console.error('AuthContext: Falha ao buscar membro via Supabase, tentando API:', supabaseError);
        
        // Tentativa #2: Verificar via API
        try {
          const apiResponse = await fetch('/api/auth/check');
          if (apiResponse.ok) {
            const authData = await apiResponse.json();
            if (authData.authenticated && authData.user && authData.user.userMetadata && authData.user.userMetadata.role) {
              member = { type: authData.user.userMetadata.role };
              console.log('AuthContext: Obtido tipo de membro via API:', member.type);
            }
          }
        } catch (apiError) {
          console.error('AuthContext: Erro ao verificar autenticação via API:', apiError);
        }
      }
      
      if (!member) {
        console.error('AuthContext: Não foi possível determinar o tipo de membro após múltiplas tentativas');
        // Redirecionar para página de aprovação pendente como fallback
        router.push('/pending-approval');
        return;
      }
      
      console.log('AuthContext: Redirecionando baseado no tipo de membro:', member?.type);
      
      // Função auxiliar para verificar o tipo independente de maiúsculas/minúsculas
      const isMemberType = (type: string, value: string) => {
        return type?.toLowerCase() === value.toLowerCase();
      };
      
      // Redirecionar com base no tipo de membro de forma case-insensitive
      if (member && isMemberType(member.type, 'member')) {
        router.push('/profile');
      } else if (member && isMemberType(member.type, 'admin')) {
        router.push('/dashboard');
      } else if (member && isMemberType(member.type, 'pendente')) {
        router.push('/pending-approval');
      } else {
        // Inativo ou outro tipo vai para dashboard e o middleware
        // vai redirecionar conforme necessário
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('AuthContext: Erro ao verificar tipo de membro:', err);
      // Em caso de erro, tentar ir para o dashboard e deixar o middleware decidir
      router.push('/dashboard');
    }
  };

  // Valores do contexto
  const contextValue = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
} 