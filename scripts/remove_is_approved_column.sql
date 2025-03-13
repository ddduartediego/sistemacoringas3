-- Script para remover a coluna is_approved da tabela profiles

-- Verificar se a coluna existe antes de removê-la
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles DROP COLUMN is_approved;
    RAISE NOTICE 'Coluna is_approved removida com sucesso!';
  ELSE
    RAISE NOTICE 'A coluna is_approved não existe na tabela profiles.';
  END IF;
END $$;

-- Se você estiver usando o SQL Editor do Supabase, você pode executar apenas:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_approved; 