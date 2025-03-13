-- Script SQL Unificado para Configuração do Sistema Coringas
-- Este script combina todas as configurações necessárias para o banco de dados

-- Habilitando a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Usuário (extendendo auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- Email do usuário, sincronizado do provedor de autenticação
  name TEXT, -- Nome do usuário, sincronizado do provedor de autenticação
  full_name TEXT, -- Nome completo do usuário, sincronizado do provedor de autenticação
  avatar_url TEXT, -- URL da imagem de avatar do usuário
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para documentação das colunas da tabela profiles
COMMENT ON COLUMN profiles.email IS 'Endereço de email do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.name IS 'Nome curto ou apelido do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.full_name IS 'Nome completo do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.avatar_url IS 'URL da imagem de avatar do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.updated_at IS 'Data e hora da última atualização do perfil';
COMMENT ON COLUMN profiles.created_at IS 'Data e hora de criação do perfil';

-- Tabela de Integrantes
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'inativo' CHECK (type IN ('member', 'admin', 'inativo', 'rejeitado')),
  nickname TEXT,
  status TEXT CHECK (status IN ('aposentado', 'veterano', 'calouro', 'patrocinador', 'comercial')),
  financial_status TEXT DEFAULT 'ok' CHECK (financial_status IN ('ok', 'pendente')),
  pending_amount DECIMAL(10, 2) DEFAULT 0,
  team_role TEXT CHECK (team_role IN ('rua', 'qg', 'lideranca')),
  shirt_size TEXT CHECK (shirt_size IN ('PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG')),
  birth_date DATE,
  cpf TEXT,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'prefiro_nao_responder')),
  phone TEXT,
  profession TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Cobranças
CREATE TABLE IF NOT EXISTS public.charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  payment_date DATE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inicializando configurações padrão
INSERT INTO system_configs (key, value)
VALUES 
  ('shirt_sizes', '["PP", "P", "M", "G", "GG", "XG", "XXG"]'),
  ('member_statuses', '["calouro", "veterano", "aposentado", "patrocinador", "comercial"]'),
  ('team_roles', '["rua", "qg", "lideranca"]')
ON CONFLICT (key) DO NOTHING;

-- Scripts para Atualização de Tabelas Existentes
-- Se você estiver atualizando um banco de dados já existente, 
-- execute os comandos abaixo para adicionar as colunas necessárias

-- Adicionando colunas necessárias à tabela profiles (se não existirem)
DO $$ 
BEGIN 
  -- Remover a coluna is_approved se existir (substituída pelo fluxo de aprovação)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles DROP COLUMN is_approved;
    RAISE NOTICE 'Coluna is_approved removida com sucesso!';
  END IF;

  -- Adicionar coluna email se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada com sucesso!';
  END IF;

  -- Adicionar coluna name se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name TEXT;
    RAISE NOTICE 'Coluna name adicionada com sucesso!';
  END IF;
END $$;

-- Para PostgreSQL versões mais recentes (se disponível no Supabase)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_approved; 