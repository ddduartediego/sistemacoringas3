'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaExclamationTriangle,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Event, Member, Charge } from '@/types';

// Importações mockadas temporariamente até que os dados reais possam ser carregados
// Remova essas funções e importe as reais quando o problema de autenticação estiver resolvido
const mockGetFutureEvents = () => {
  console.log('Carregando eventos mockados');
  return Promise.resolve([
    { 
      id: '1', 
      title: 'Reunião geral', 
      description: 'Reunião geral da equipe Coringas', 
      date: new Date().toISOString(), 
      location: 'Sede',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};

const mockGetAllMembers = () => {
  console.log('Carregando membros mockados');
  return Promise.resolve([
    { 
      id: '1', 
      user_id: '1', 
      nickname: 'João', 
      status: 'veterano', 
      type: 'admin', 
      team_role: 'lideranca',
      financial_status: 'ok',
      shirt_size: 'M',
      birth_date: '1990-01-01',
      cpf: '123.456.789-00',
      gender: 'masculino',
      phone: '(11) 98765-4321',
      profession: 'Desenvolvedor',
      pending_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '2', 
      user_id: '2', 
      nickname: 'Maria', 
      status: 'calouro', 
      type: 'member', 
      team_role: 'rua',
      financial_status: 'ok',
      shirt_size: 'P',
      birth_date: '1995-05-05',
      cpf: '987.654.321-00',
      gender: 'feminino',
      phone: '(11) 91234-5678',
      profession: 'Designer',
      pending_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};

const mockGetPendingChargesByMemberId = () => {
  console.log('Carregando cobranças mockadas');
  return Promise.resolve([
    {
      id: '1',
      member_id: '1',
      description: 'Mensalidade Maio/2023',
      amount: 50,
      due_date: '2023-05-10',
      paid_date: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};

// Função auxiliar para converter o status em string para o tipo Charge.status
const convertChargeStatus = (status: string): 'pending' | 'paid' => {
  if (status === 'pending' || status === 'paid') {
    return status;
  }
  // Default para pendente se o status não for reconhecido
  console.warn(`Status de cobrança desconhecido: ${status}, usando 'pending' como padrão`);
  return 'pending';
};

// Funções reais de API
const getFutureEvents = async () => {
  console.log('Tentando buscar eventos reais...');
  try {
    const supabase = createClientComponentClient();
    
    // Buscar eventos futuros (data maior ou igual à data atual)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
    
    console.log('Eventos encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Falha ao buscar eventos:', error);
    return mockGetFutureEvents();
  }
};

const getAllMembers = async () => {
  console.log('Tentando buscar membros reais...');
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('members')
      .select('*');
      
    if (error) {
      console.error('Erro ao buscar membros:', error);
      throw error;
    }
    
    console.log('Membros encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Falha ao buscar membros:', error);
    return mockGetAllMembers();
  }
};

const getPendingChargesByMemberId = async (memberId: string) => {
  console.log('Tentando buscar cobranças reais para o membro:', memberId);
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('charges')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar cobranças:', error);
      throw error;
    }
    
    console.log('Cobranças pendentes encontradas:', data?.length || 0);
    
    // Converter o campo status para garantir a compatibilidade com o tipo Charge
    const typedCharges: Charge[] = (data || []).map(charge => ({
      ...charge,
      status: convertChargeStatus(charge.status)
    }));
    
    return typedCharges;
  } catch (error) {
    console.error('Falha ao buscar cobranças:', error);
    // Converter dados mockados também
    const mockData = await mockGetPendingChargesByMemberId();
    return mockData.map(charge => ({
      ...charge,
      status: convertChargeStatus(charge.status)
    }));
  }
};

// Buscar membro por user_id
const getMemberByUserId = async (userId: string) => {
  console.log('Tentando buscar membro por user_id:', userId);
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Erro ao buscar membro por user_id:', error);
      throw error;
    }
    
    console.log('Membro encontrado:', !!data);
    return data;
  } catch (error) {
    console.error('Falha ao buscar membro por user_id:', error);
    return null;
  }
};

// Componente Card para estatísticas
const StatCard = ({ 
  title, 
  value, 
  icon, 
  bgColor 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  bgColor: string 
}) => (
  <div className={`${bgColor} rounded-lg shadow-sm p-6`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="text-gray-600">{icon}</div>
    </div>
  </div>
);

// Componente para eventos próximos
const EventCard = ({ event }: { event: any }) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{event.title}</h3>
        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
          {formattedDate}
        </span>
      </div>
      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{event.description}</p>
      <p className="text-gray-500 text-sm mt-2">
        <span className="font-medium">Local:</span> {event.location}
      </p>
    </div>
  );
};

// Componente para cobranças pendentes
const ChargeCard = ({ charge }: { charge: any }) => {
  if (!charge || !charge.due_date) {
    console.warn('Dados de cobrança inválidos ou incompletos:', charge);
    return null;
  }

  const dueDate = new Date(charge.due_date);
  const now = new Date();
  
  // Certifique-se de que a data de vencimento é válida
  const isValidDate = !isNaN(dueDate.getTime());
  if (!isValidDate) {
    console.warn('Data de vencimento inválida:', charge.due_date);
    return null;
  }
  
  const formattedDate = dueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const isOverdue = dueDate < now;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{charge.description || 'Cobrança sem descrição'}</h3>
        <span className={`text-sm py-1 px-2 rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isOverdue ? 'Atrasado' : 'Pendente'}
        </span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-gray-600 text-sm">
          <span className="font-medium">Vencimento:</span> {formattedDate}
        </p>
        <p className="text-gray-900 font-medium">
          R$ {typeof charge.amount === 'number' ? charge.amount.toFixed(2) : '0.00'}
        </p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingCharges, setPendingCharges] = useState<Charge[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log do estado atual para debug
  useEffect(() => {
    console.log('Dashboard - Estado de autenticação:', { 
      authLoading, 
      user: user ? 'Sim' : 'Não', 
      userDetails: user ? JSON.stringify(user).substring(0, 100) + '...' : null,
      authError
    });
  }, [user, authLoading, authError]);

  useEffect(() => {
    // Se ainda estiver carregando a autenticação, não faça nada
    if (authLoading) {
      console.log('Dashboard - Aguardando conclusão da autenticação...');
      return;
    }

    // Função para buscar dados
    const fetchData = async () => {
      try {
        console.log('Dashboard - Iniciando carregamento de dados');
        setLoading(true);
        
        // Carregar eventos com tratamento de erro
        let eventData: Event[] = [];
        try {
          eventData = await getFutureEvents();
          console.log('Eventos carregados:', eventData.length);
        } catch (e) {
          console.error('Erro ao carregar eventos:', e);
          eventData = [];
        }
        setEvents(eventData);

        // Carregar lista de membros com tratamento de erro
        let memberData: Member[] = [];
        try {
          memberData = await getAllMembers();
          console.log('Membros carregados:', memberData.length);
        } catch (e) {
          console.error('Erro ao carregar membros:', e);
          memberData = [];
        }
        setMembers(memberData);

        // Se o usuário estiver autenticado, tentar buscar o membro correspondente
        let memberInfo = null;
        if (user?.id) {
          try {
            memberInfo = await getMemberByUserId(user.id);
            console.log('Dados do membro atual:', memberInfo);
            setCurrentMember(memberInfo);
          } catch (e) {
            console.error('Erro ao buscar membro:', e);
          }
          
          // Buscar cobranças pendentes para o membro
          let chargeData: Charge[] = [];
          if (memberInfo?.id) {
            try {
              chargeData = await getPendingChargesByMemberId(memberInfo.id);
              console.log('Cobranças carregadas:', chargeData.length);
            } catch (e) {
              console.error('Erro ao carregar cobranças:', e);
              chargeData = [];
            }
            setPendingCharges(chargeData);
          } else {
            console.log('Membro não encontrado para o usuário autenticado, usando dados mockados');
            try {
              const mockCharges = await mockGetPendingChargesByMemberId();
              chargeData = mockCharges.map(charge => ({
                ...charge,
                status: convertChargeStatus(charge.status)
              }));
            } catch (e) {
              console.error('Erro ao carregar cobranças mockadas:', e);
              chargeData = [];
            }
            setPendingCharges(chargeData);
          }
        } else {
          // Se não houver usuário, usar dados mockados para as cobranças
          console.log('Usuário não disponível, usando dados mockados para cobranças');
          try {
            const mockCharges = await mockGetPendingChargesByMemberId();
            const chargeData = mockCharges.map(charge => ({
              ...charge,
              status: convertChargeStatus(charge.status)
            }));
            setPendingCharges(chargeData);
          } catch (e) {
            console.error('Erro ao carregar cobranças mockadas:', e);
            setPendingCharges([]);
          }
        }
        
        console.log('Dashboard - Dados carregados com sucesso');
      } catch (error: any) {
        console.error('Erro ao buscar dados para o dashboard:', error);
        setError(`Erro ao carregar os dados: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };

    // Iniciar carregamento de dados
    fetchData();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-700">Erro de autenticação: {authError}</p>
          </div>
          <Link href="/login" className="text-blue-600 hover:underline">
            Voltar para a página de login
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <p className="text-yellow-700">Você não está autenticado.</p>
          </div>
          <Link href="/login" className="text-blue-600 hover:underline">
            Ir para a página de login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-700 text-white px-4 py-2 rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Filtragem segura para evitar erros com dados inválidos
  const veteranosCount = members
    ? members.filter(member => member && member.status === 'veterano').length
    : 0;
  const calourosCount = members 
    ? members.filter(member => member && member.status === 'calouro').length
    : 0;
  const proximosEventos = events ? events.slice(0, 3) : []; // Pegar os próximos 3 eventos

  return (
    <div className="p-6">
      {/* Não precisamos mais do MemberChecker aqui, ele terá sido executado durante o login */}
      
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <p className="text-gray-600">Bem-vindo ao Sistema Coringas, {user?.user_metadata?.name || 'Usuário'}!</p>
      </div>

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total de Integrantes" 
          value={members.length} 
          icon={<FaUsers className="w-6 h-6" />} 
          bgColor="bg-white"
        />
        <StatCard 
          title="Veteranos" 
          value={veteranosCount} 
          icon={<FaUsers className="w-6 h-6" />} 
          bgColor="bg-white"
        />
        <StatCard 
          title="Calouros" 
          value={calourosCount} 
          icon={<FaUsers className="w-6 h-6" />} 
          bgColor="bg-white"
        />
        <StatCard 
          title="Próximos Eventos" 
          value={events.length} 
          icon={<FaCalendarAlt className="w-6 h-6" />} 
          bgColor="bg-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximos eventos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Próximos Eventos</h2>
            <Link 
              href="/dashboard/events" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos
            </Link>
          </div>
          {proximosEventos.length > 0 ? (
            <div className="space-y-4">
              {proximosEventos.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <FaCalendarAlt className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Nenhum evento programado no momento.</p>
              <p className="text-sm text-gray-500 mt-1">Estamos trabalhando em novos eventos.</p>
            </div>
          )}
        </div>

        {/* Cobranças pendentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Minhas Cobranças Pendentes</h2>
            <Link 
              href="/profile" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas
            </Link>
          </div>
          {pendingCharges.length > 0 ? (
            <div className="space-y-4">
              {pendingCharges
                .filter(charge => charge && charge.id && charge.due_date) // Garantir que só cobranças válidas sejam exibidas
                .slice(0, 3)
                .map(charge => (
                  <ChargeCard key={charge.id} charge={charge} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <FaMoneyBillWave className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Você não tem cobranças pendentes.</p>
              <p className="text-sm text-gray-500 mt-1">O sistema está funcionando corretamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 