-- Tabela de Usuários (gerenciada pelo Supabase Auth)
-- Não é necessário criar, apenas estender com campos personalizados

-- Extensão para a tabela de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Integrantes
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('member', 'admin')),
  nickname TEXT,
  status TEXT NOT NULL CHECK (status IN ('aposentado', 'veterano', 'calouro', 'patrocinador', 'comercial')),
  financial_status TEXT NOT NULL CHECK (financial_status IN ('ok', 'pendente')),
  pending_amount DECIMAL(10, 2),
  team_role TEXT NOT NULL CHECK (team_role IN ('rua', 'qg', 'lideranca')),
  shirt_size TEXT CHECK (shirt_size IN ('PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG')),
  birth_date DATE,
  cpf TEXT,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'prefiro_nao_responder')),
  phone TEXT,
  profession TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cobranças
CREATE TABLE IF NOT EXISTS public.charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending')),
  payment_date DATE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações iniciais
INSERT INTO public.system_configs (key, value)
VALUES 
  ('member_types', '["member", "admin"]'),
  ('member_status', '["aposentado", "veterano", "calouro", "patrocinador", "comercial"]'),
  ('financial_status', '["ok", "pendente"]'),
  ('team_roles', '["rua", "qg", "lideranca"]'),
  ('shirt_sizes', '["PP", "P", "M", "G", "GG", "XG", "XXG"]'),
  ('genders', '["masculino", "feminino", "prefiro_nao_responder"]');

-- Políticas para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Políticas para a tabela members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos os usuários podem ver integrantes" 
ON public.members FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = TRUE));

CREATE POLICY "Usuários podem atualizar seus próprios dados de integrante" 
ON public.members FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Administradores podem atualizar qualquer integrante" 
ON public.members FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE user_id = auth.uid() AND type = 'admin'
));

-- Políticas para a tabela charges
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias cobranças" 
ON public.charges FOR SELECT 
USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Administradores podem ver todas as cobranças" 
ON public.charges FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE user_id = auth.uid() AND type = 'admin'
));

CREATE POLICY "Administradores podem gerenciar cobranças" 
ON public.charges FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE user_id = auth.uid() AND type = 'admin'
));

-- Políticas para a tabela events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos os usuários aprovados podem ver eventos" 
ON public.events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = TRUE));

CREATE POLICY "Administradores podem gerenciar eventos" 
ON public.events FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE user_id = auth.uid() AND type = 'admin'
));

-- Políticas para a tabela system_configs
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos os usuários aprovados podem ver configurações" 
ON public.system_configs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = TRUE));

CREATE POLICY "Administradores podem gerenciar configurações" 
ON public.system_configs FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE user_id = auth.uid() AND type = 'admin'
));

-- IMPORTANTE: Após criar um usuário com o email dd.duartediego@gmail.com via autenticação do Google,
-- execute os comandos abaixo substituindo 'ID_DO_USUARIO_CRIADO' pelo ID do usuário:

/*
INSERT INTO public.members (user_id, type, nickname, status, financial_status, team_role, shirt_size, gender)
VALUES 
  ('ID_DO_USUARIO_CRIADO', 'admin', 'Admin', 'veterano', 'ok', 'lideranca', 'M', 'prefiro_nao_responder');

UPDATE public.profiles
SET is_approved = TRUE
WHERE id = 'ID_DO_USUARIO_CRIADO';
*/ 