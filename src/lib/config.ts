import { supabase } from './supabase';
import { SystemConfig } from '@/types';

// Função para obter todas as configurações
export const getAllConfigs = async () => {
  const { data, error } = await supabase
    .from('system_configs')
    .select('*')
    .order('key', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar configurações:', error);
    return [];
  }
  
  return data as SystemConfig[];
};

// Função para obter uma configuração específica pelo nome
export const getConfigByKey = async (key: string) => {
  const { data, error } = await supabase
    .from('system_configs')
    .select('*')
    .eq('key', key)
    .single();
    
  if (error) {
    console.error(`Erro ao buscar configuração '${key}':`, error);
    return null;
  }
  
  return data as SystemConfig;
};

// Função para obter valores de uma configuração específica
export const getConfigValues = async (key: string): Promise<string[]> => {
  const config = await getConfigByKey(key);
  
  if (!config) {
    return [];
  }
  
  return config.value;
};

// Função para atualizar uma configuração
export const updateConfig = async (key: string, values: string[]) => {
  const { data, error } = await supabase
    .from('system_configs')
    .update({
      value: values,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)
    .select();
    
  if (error) {
    console.error(`Erro ao atualizar configuração '${key}':`, error);
    throw error;
  }
  
  return data[0] as SystemConfig;
};

// Função para adicionar um valor a uma configuração
export const addConfigValue = async (key: string, value: string) => {
  const config = await getConfigByKey(key);
  
  if (!config) {
    throw new Error(`Configuração '${key}' não encontrada`);
  }
  
  const currentValues = config.value;
  
  if (currentValues.includes(value)) {
    return config; // Valor já existe, retorna configuração atual
  }
  
  const newValues = [...currentValues, value];
  
  return updateConfig(key, newValues);
};

// Função para remover um valor de uma configuração
export const removeConfigValue = async (key: string, value: string) => {
  const config = await getConfigByKey(key);
  
  if (!config) {
    throw new Error(`Configuração '${key}' não encontrada`);
  }
  
  const currentValues = config.value;
  const newValues = currentValues.filter(v => v !== value);
  
  return updateConfig(key, newValues);
}; 