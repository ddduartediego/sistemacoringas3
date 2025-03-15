'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { FaUser, FaEdit, FaSave, FaTimes, FaMoneyBillWave, FaHistory, FaIdCard, FaTshirt, FaPhone, FaBirthdayCake, FaBriefcase, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { SystemConfig } from '@/types';
import { getConfigValues } from '@/lib/config';

export default function Profile() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [shirtSizes, setShirtSizes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nickname: '',
    shirt_size: '',
    phone: '',
    profession: '',
    cpf: '',
    birth_date: '',
  });

  // Buscar dados do membro quando o componente montar
  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        if (!user?.id) return;
        
        setIsLoading(true);
        
        // Usar novo cliente do Supabase
        const supabase = createClient();
        
        const { data: memberData, error } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar dados do membro:', error);
          setError('Não foi possível carregar suas informações. Tente novamente mais tarde.');
        } else {
          setMemberInfo(memberData || {});
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      } finally {
        setIsFetching(false);
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [user?.id]);

  // Buscar configurações de tamanho de camiseta quando o modal for aberto
  useEffect(() => {
    if (isModalOpen) {
      async function fetchShirtSizes() {
        try {
          const sizes = await getConfigValues('shirt_sizes');
          setShirtSizes(sizes);
        } catch (err) {
          console.error('Erro ao buscar tamanhos de camiseta:', err);
          // Não definimos erro aqui para não atrapalhar a experiência do usuário
          // Usamos um fallback de tamanhos padrão no caso de erro
          setShirtSizes(['PP', 'P', 'M', 'G', 'GG']);
        }
      }
      
      fetchShirtSizes();
    }
  }, [isModalOpen]);

  // Inicializar dados do formulário quando o modal é aberto
  useEffect(() => {
    if (isModalOpen && memberInfo) {
      setFormData({
        nickname: memberInfo.nickname || '',
        shirt_size: memberInfo.shirt_size || '',
        phone: memberInfo.phone || '',
        profession: memberInfo.profession || '',
        cpf: memberInfo.cpf || '',
        birth_date: memberInfo.birth_date || '',
      });
    }
  }, [isModalOpen, memberInfo]);

  // Resetar mensagem de sucesso após 3 segundos
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Aplicar máscara ao CPF
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove caracteres não numéricos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após 3 dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após 3 dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen entre os 3 últimos dígitos e os 2 finais
      .replace(/(-\d{2})\d+?$/, '$1'); // Limita a quantidade para 11 dígitos
  };

  // Aplicar máscara ao telefone
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove caracteres não numéricos
      .replace(/(\d{2})(\d)/, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen entre o quinto e sexto dígito
      .replace(/(-\d{4})\d+?$/, '$1'); // Limita a quantidade para 11 dígitos
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Aplicar máscara dependendo do campo
    if (name === 'cpf') {
      setFormData((prev) => ({
        ...prev,
        [name]: maskCPF(value),
      }));
    } else if (name === 'phone') {
      setFormData((prev) => ({
        ...prev,
        [name]: maskPhone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!user || !memberInfo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar apenas os campos necessários para atualização
      const dataToSave = {
        nickname: formData.nickname,
        shirt_size: formData.shirt_size,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        profession: formData.profession,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        birth_date: formData.birth_date || null
      };
      
      console.log('Membro sendo atualizado:', memberInfo);
      console.log('Dados a serem salvos:', dataToSave);
      
      // Primeiro tentamos buscar novamente o registro para garantir que ele existe
      const supabase = createClient();
      const { data: existingMember, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) {
        console.error('Erro ao buscar membro para atualização:', fetchError);
        setError(`Não foi possível encontrar seus dados: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log('Membro encontrado para atualização:', existingMember);
      
      // Se chegamos aqui, o membro existe, então podemos atualizá-lo
      const { data, error } = await supabase
        .from('members')
        .update(dataToSave)
        .eq('id', existingMember.id)
        .select();
      
      if (error) {
        console.error('Erro ao atualizar membro:', error);
        console.error('Detalhes do erro:', JSON.stringify(error));
        setError(`Erro ao salvar: ${error.message || error.details || 'Tente novamente mais tarde.'}`);
        setIsLoading(false);
        return;
      }
      
      console.log('Dados atualizados com sucesso:', data);
      
      // Atualizar os dados do membro após salvar com sucesso
      setMemberInfo({
        ...memberInfo,
        ...dataToSave,
        // Aplicar máscaras para exibição
        cpf: dataToSave.cpf,
        phone: dataToSave.phone
      });
      
      setIsModalOpen(false);
      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Erro inesperado ao salvar:', err);
      setError(`Ocorreu um erro inesperado: ${err?.message || 'Tente novamente mais tarde.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mostrar carregamento enquanto busca os dados
  if (isFetching) {
    return (
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
            <p className="text-gray-600 mb-6">Carregando suas informações...</p>
            <div className="flex justify-center">
              <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dados do perfil do usuário
  const userMetadata = user.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture;
  const fullName = userMetadata.full_name || userMetadata.name || 'Nome não disponível';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaUser className="text-blue-600 text-2xl mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <p className="text-gray-600 mb-6">Gerencie suas informações pessoais e veja sua situação financeira</p>
          
          {saveSuccess && (
            <motion.div 
              className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p>Perfil atualizado com sucesso!</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p>{error}</p>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-white p-1 mb-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar do usuário"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <FaUser className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-white">{fullName}</h2>
              <p className="text-blue-100">{user.email}</p>
            </div>
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <FaEdit className="mr-2" /> Editar
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {memberInfo?.type === 'Admin' ? 'Administrador' : 'Membro'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {memberInfo?.status === 'calouro' ? 'Calouro' : 
                   memberInfo?.status === 'veterano' ? 'Veterano' : 
                   memberInfo?.status === 'aposentado' ? 'Aposentado' : 
                   memberInfo?.status === 'patrocinador' ? 'Patrocinador' : 'Comercial'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {memberInfo?.team_role === 'rua' ? 'Rua' : 
                   memberInfo?.team_role === 'qg' ? 'QG' : 'Liderança'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaUser className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Apelido</p>
                    {memberInfo?.nickname ? (
                      <p className="font-medium">{memberInfo.nickname}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaTshirt className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Tamanho da Camiseta</p>
                    {memberInfo?.shirt_size ? (
                      <p className="font-medium">{memberInfo.shirt_size}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
              
                <div className="flex items-center">
                  <FaIdCard className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">CPF</p>
                    {memberInfo?.cpf ? (
                      <p className="font-medium">{maskCPF(memberInfo.cpf)}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaBirthdayCake className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Data de Nascimento</p>
                    {memberInfo?.birth_date ? (
                      <p className="font-medium">{new Date(memberInfo.birth_date).toLocaleDateString('pt-BR')}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaPhone className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    {memberInfo?.phone ? (
                      <p className="font-medium">{maskPhone(memberInfo.phone)}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaBriefcase className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Profissão</p>
                    {memberInfo?.profession ? (
                      <p className="font-medium">{memberInfo.profession}</p>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center">
                        <FaInfoCircle className="mr-1" /> Favor informar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="lg:col-span-2">
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center">
                <FaMoneyBillWave className="text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Situação Financeira</h3>
                  <p className="text-sm text-gray-600">Informações sobre sua situação financeira na equipe</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center p-4 rounded-lg bg-gray-50 mb-6">
                <div className={`w-4 h-4 rounded-full mr-2 ${memberInfo?.financial_status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {memberInfo?.financial_status === 'ok' ? 'Situação Regular' : 'Com Pendências'}
                </span>
                
                {memberInfo?.financial_status !== 'ok' && memberInfo?.pending_amount && (
                  <span className="ml-auto font-medium text-red-600">
                    R$ {parseFloat(memberInfo.pending_amount).toFixed(2)}
                  </span>
                )}
              </div>
              
              {memberInfo?.financial_status !== 'ok' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-red-500" /> Cobranças Pendentes:
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-red-50 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-red-700">Mensalidade Maio/2023</span>
                      <span className="font-medium">R$ 50,00</span>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-red-700">Evento Confraternização</span>
                      <span className="font-medium">R$ 30,00</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaHistory className="mr-2 text-blue-500" /> Histórico de Pagamentos:
                </h4>
                <div className="space-y-2">
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-blue-700">Mensalidade Abril/2023</span>
                      <p className="text-xs text-gray-500">Pago em 10/04/2023</p>
                    </div>
                    <span className="font-medium">R$ 50,00</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-blue-700">Mensalidade Março/2023</span>
                      <p className="text-xs text-gray-500">Pago em 05/03/2023</p>
                    </div>
                    <span className="font-medium">R$ 50,00</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-blue-700">Mensalidade Fevereiro/2023</span>
                      <p className="text-xs text-gray-500">Pago em 08/02/2023</p>
                    </div>
                    <span className="font-medium">R$ 50,00</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div 
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Editar Informações Pessoais</h3>
                <button 
                  className="text-white hover:text-gray-200 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da Camiseta</label>
                    <select
                      name="shirt_size"
                      value={formData.shirt_size}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Selecione o tamanho</option>
                      {shirtSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Salvar Alterações
                      </>
                    )}
                  </button>
                  <button
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                  >
                    <FaTimes className="mr-2" /> Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 