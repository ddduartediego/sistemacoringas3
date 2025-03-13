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
  const supabase = createClientComponentClient();

  // Função para verificar se o usuário tem um registro de membro e criar se não tiver
  const checkAndCreateMember = async (userId: string, userData: User) => {
    try {
      console.log('Verificando registro de membro para o usuário:', userId);
      
      // Verificar se o usuário já possui um registro de membro
      const { data: existingMember, error: checkError } = await supabase
        .from('members')
        .select('id, type')
        .eq('user_id', userId)
        .single();
      
      // Se já existe um membro, não fazemos nada
      if (existingMember) {
        console.log('Usuário já possui registro de membro:', existingMember.type);
        return;
      }
      
      // Se não existe (erro PGRST116 - No Results) ou outro erro, verificamos
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar registro de membro:', checkError);
        return;
      }
      
      // Criar um novo registro de membro do tipo "inativo"
      console.log('Criando registro de membro inativo para novo usuário');
      
      const fullName = userData.user_metadata?.full_name || 
                      userData.user_metadata?.name || 
                      userData.email?.split('@')[0] || 
                      'Novo Membro';
      
      const { error: insertError } = await supabase
        .from('members')
        .insert([{
          user_id: userId,
          nickname: fullName,
          status: 'calouro', // Status inicial
          type: 'inativo', // Tipo inicial (aguardando aprovação)
          team_role: 'rua',
          financial_status: 'ok',
          shirt_size: 'M',
          gender: 'prefiro_nao_responder',
          pending_amount: 0
        }]);
        
      if (insertError) {
        console.error('Erro ao criar registro de membro inativo:', insertError);
      } else {
        console.log('Registro de membro inativo criado com sucesso');
        // Atualizar a página para aplicar as restrições de acesso
        router.refresh();
      }
    } catch (error) {
      console.error('Erro ao verificar/criar membro:', error);
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

  useEffect(() => {
    // Função para buscar a sessão do usuário
    const getSession = async () => {
      try {
        console.log('Verificando sessão...');
        setIsLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          console.log('Sessão encontrada');
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          console.log('Usuário encontrado:', !!userData.user);
          const currentUser = userData.user as unknown as User;
          setUser(currentUser);
          
          // Sincronizar perfil do usuário quando a sessão é carregada inicialmente
          console.log('Sincronizando perfil do usuário durante inicialização da sessão');
          await syncUserProfileAfterLogin(supabase, currentUser);
          
          // Verificar e criar registro de membro se necessário
          if (currentUser.id) {
            await checkAndCreateMember(currentUser.id, currentUser);
          }
        } else {
          console.log('Nenhuma sessão encontrada');
          setUser(null);
        }
      } catch (error: any) {
        console.error('Erro ao buscar sessão:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Buscar sessão inicial
    getSession();

    // Configurar listener para mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de autenticação:', event);
      
      if (session) {
        const { data: userData } = await supabase.auth.getUser();
        console.log('Usuário atualizado após evento de autenticação');
        const currentUser = userData.user as unknown as User;
        setUser(currentUser);
        
        // Processar evento de login
        if (event === 'SIGNED_IN' && currentUser.id) {
          // Garantir que temos os dados mais recentes do usuário
          const { data: refreshedUserData, error: refreshError } = await supabase.auth.getUser();
          if (!refreshError && refreshedUserData && refreshedUserData.user) {
            console.log('Obtendo dados mais recentes do usuário após login');
            const refreshedUser = refreshedUserData.user as unknown as User;
            setUser(refreshedUser);
            
            // Sincronizar perfil com dados atualizados
            await syncUserProfileAfterLogin(supabase, refreshedUser);
          } else {
            // Usar os dados atuais se não conseguir obter dados atualizados
            console.warn('Não foi possível obter dados atualizados. Usando dados atuais.');
            await syncUserProfileAfterLogin(supabase, currentUser);
          }
          
          // Verificar e criar registro de membro se necessário
          await checkAndCreateMember(currentUser.id, currentUser);
          
          console.log('Usuário conectado, verificando tipo para redirecionamento');
          
          // Verificar tipo de membro e redirecionar
          await checkMemberTypeAndRedirect(currentUser.id);
        }
      } else {
        console.log('Usuário desconectado após evento de autenticação');
        setUser(null);
        
        // Ações baseadas no evento
        if (event === 'SIGNED_OUT') {
          console.log('Usuário desconectado, redirecionando para login');
          router.refresh();
          router.push('/login');
        }
      }
      
      setIsLoading(false);
    });

    // Limpar listener ao desmontar o componente
    return () => {
      console.log('Limpando listener de autenticação');
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signInWithGoogle = async () => {
    try {
      console.log('Iniciando login com Google...');
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Redirecionando para autenticação Google');
      // Não vamos definir isLoading como false aqui, pois estamos redirecionando para o Google
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error.message);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Iniciando processo de logout...');
      setIsLoading(true);
      setError(null);
      
      // Chamada para encerrar a sessão no Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Especificando 'local' para limpar apenas o armazenamento local, não todas as sessões do usuário em outros dispositivos
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Logout bem-sucedido. Redirecionando para página inicial...');
      
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
      console.error('Erro durante o processo de logout:', error.message);
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
      const { data: member, error } = await supabase
        .from('members')
        .select('type')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Erro ao verificar tipo de membro para redirecionamento:', error);
        return;
      }
      
      console.log('Redirecionando baseado no tipo de membro:', member?.type);
      
      // Função auxiliar para verificar o tipo independente de maiúsculas/minúsculas
      const isMemberType = (type: string, value: string) => {
        return type?.toLowerCase() === value.toLowerCase();
      };
      
      // Redirecionar com base no tipo de membro de forma case-insensitive
      if (member && isMemberType(member.type, 'member')) {
        router.push('/profile');
      } else if (member && isMemberType(member.type, 'admin')) {
        router.push('/dashboard');
      } else {
        // Inativo ou outro tipo vai para dashboard e o middleware
        // vai redirecionar conforme necessário
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Erro ao verificar tipo de membro:', err);
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