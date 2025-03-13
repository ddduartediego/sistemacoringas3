'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@/types';

interface MemberCheckerProps {
  user: User;
}

export default function MemberChecker({ user }: MemberCheckerProps) {
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkAndCreateMember = async () => {
      try {
        if (!user.id) return;
        
        const supabase = createClientComponentClient();
        
        // Verificar se o usuário já possui um registro de membro
        const { data: existingMember, error: checkError } = await supabase
          .from('members')
          .select('id, type')
          .eq('user_id', user.id)
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
        
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Novo Membro';
        
        const { error: insertError } = await supabase
          .from('members')
          .insert([{
            user_id: user.id,
            nickname: fullName,
            status: 'calouro', // Status inicial
            type: 'Inativo', // Tipo inicial (aguardando aprovação) - com 'I' maiúsculo para consistência
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
          // Recarregar a página para aplicar as restrições de acesso
          window.location.reload();
        }
      } catch (error) {
        console.error('Erro ao verificar/criar membro:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAndCreateMember();
  }, [user]);
  
  // Este componente não renderiza nada visível
  return null;
} 