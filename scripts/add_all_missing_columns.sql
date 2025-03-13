-- Script para adicionar todas as colunas necessárias à tabela profiles

-- Adicionar coluna 'email' se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Adicionar coluna 'name' se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Garantir que a coluna 'full_name' existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Garantir que a coluna 'avatar_url' existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Garantir que a coluna 'updated_at' existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Garantir que a coluna 'created_at' existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar comentários para documentação
COMMENT ON COLUMN profiles.email IS 'Endereço de email do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.name IS 'Nome curto ou apelido do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.full_name IS 'Nome completo do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.avatar_url IS 'URL da imagem de avatar do usuário, sincronizado do provedor de autenticação';
COMMENT ON COLUMN profiles.updated_at IS 'Data e hora da última atualização do perfil';
COMMENT ON COLUMN profiles.created_at IS 'Data e hora de criação do perfil'; 