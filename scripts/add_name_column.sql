-- Script para adicionar a coluna 'name' à tabela 'profiles'

-- Verificar se a coluna já existe e criar apenas se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    -- Adicionar a coluna name (tipo texto, permite valores nulos)
    ALTER TABLE profiles ADD COLUMN name TEXT;
    
    -- Comentário para documentação
    COMMENT ON COLUMN profiles.name IS 'Nome curto ou apelido do usuário, sincronizado do provedor de autenticação';
    
    RAISE NOTICE 'Coluna name adicionada com sucesso à tabela profiles!';
  ELSE
    RAISE NOTICE 'A coluna name já existe na tabela profiles.';
  END IF;
END $$; 