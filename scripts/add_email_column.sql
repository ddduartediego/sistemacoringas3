-- Script para adicionar a coluna 'email' à tabela 'profiles'

-- Verificar se a coluna já existe e criar apenas se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    -- Adicionar a coluna email (tipo texto, permite valores nulos)
    ALTER TABLE profiles ADD COLUMN email TEXT;
    
    -- Comentário para documentação
    COMMENT ON COLUMN profiles.email IS 'Endereço de email do usuário, sincronizado do provedor de autenticação';
    
    -- Índice para buscas rápidas por email
    CREATE INDEX idx_profiles_email ON profiles(email);
    
    RAISE NOTICE 'Coluna email adicionada com sucesso à tabela profiles!';
  ELSE
    RAISE NOTICE 'A coluna email já existe na tabela profiles.';
  END IF;
END $$; 