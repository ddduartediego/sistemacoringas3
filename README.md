# Sistema Coringas

Sistema de gerenciamento para a Equipe Coringas, desenvolvido utilizando React, Next.js e Supabase.

## Requisitos

- Node.js 18 ou superior
- npm ou yarn
- Conta no Supabase (gratuita)

## Configuração Inicial

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/sistemacoringas.git
cd sistemacoringas
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure o Supabase

1. Crie uma conta no [Supabase](https://supabase.com) caso ainda não tenha
2. Crie um novo projeto no Supabase
3. Na seção de configurações do projeto, copie a URL e a API Key (anon public)
4. Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-api-key-do-supabase
```

### 4. Configure o banco de dados

Execute o script SQL unificado (`scripts/database_setup_complete.sql`) no editor de SQL do Supabase para criar todas as tabelas necessárias. O script inclui:

- Criação das tabelas: profiles, members, charges, events, system_configs
- Configuração correta dos tipos de dados e restrições
- Adição de colunas necessárias para a sincronização de perfil com provedores de autenticação
- Inicialização das configurações padrão do sistema

Se você tiver um banco de dados existente, o script também inclui comandos para adicionar as novas colunas necessárias às tabelas existentes.

### 5. Configure o Next.js para imagens externas

Edite o arquivo `next.config.ts` ou `next.config.js` para permitir imagens de provedores externos:

```typescript
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Para avatares do Google
      'avatars.githubusercontent.com',  // Para avatares do GitHub
      'graph.facebook.com',  // Para avatares do Facebook
    ],
  },
};

export default nextConfig;
```

Alternativamente, você pode usar a tag HTML `<img>` em vez do componente Next.js `<Image>` para evitar essa configuração.

### 6. Configure a autenticação

1. No Supabase, vá para "Authentication" > "Providers"
2. Habilite o provider "Google"
3. Siga as instruções para criar as credenciais do Google OAuth
4. Configure o URL de redirecionamento como: `https://seu-url-do-site.com/auth/callback` ou `http://localhost:3000/auth/callback` para ambiente de desenvolvimento
5. Configure as opções adicionais de acordo com sua necessidade:
   - Selecione "Indivíduos precisam de aprovação" se quiser moderar os novos usuários

## Executando o projeto

```bash
npm run dev
# ou
yarn dev
```

O sistema estará disponível em http://localhost:3000

## Funcionalidades

- **Autenticação com Google**: Login e registro usando conta Google com sincronização de perfil
- **Aprovação de Usuários**: Fluxo de moderação para novos membros com interface de aprovação para administradores
- **Dashboard**: Visão geral com estatísticas, próximos eventos e cobranças pendentes
- **Gerenciamento de Integrantes**: Cadastro e edição de membros da equipe
- **Gerenciamento de Cobranças**: Controle financeiro da equipe
- **Gerenciamento de Eventos**: Agenda de eventos da equipe
- **Perfil de Usuário**: Edição de informações pessoais com sincronização automática do Google

## Fluxo de Novos Usuários

1. Usuário faz login com Google
2. Sistema cria automaticamente:
   - Registro na tabela `profiles` com informações do Google (nome, email, avatar)
   - Registro na tabela `members` com tipo 'inativo'
3. Administrador acessa a página `/admin/pending-users`
4. Administrador avalia e aprova/rejeita os novos usuários
5. Ao aprovar, o tipo do membro muda de 'inativo' para 'member'

## Tecnologias Utilizadas

- **Frontend**: React, Next.js, TailwindCSS
- **Estado e Notificações**: React Context, react-hot-toast
- **Backend/API**: Supabase (PostgreSQL, REST, Auth)
- **Deploy**: Vercel (recomendado)

## Estrutura do Projeto

```
/src
  /app - Páginas e rotas da aplicação
    /(auth) - Autenticação (login/registro)
    /(dashboard) - Área logada do sistema
      /admin - Área de administração
        /pending-users - Aprovação de novos usuários
      /profile - Perfil do usuário
  /api - Rotas de API
    /pending-users - Lista usuários pendentes de aprovação
    /approve-user - Aprova usuário pendente
    /reject-user - Rejeita usuário pendente
  /components - Componentes reutilizáveis
  /context - Contextos React (Auth, etc)
  /lib - Funções utilitárias e API calls
  /types - Definições de tipos TypeScript
/scripts - Scripts SQL e utilitários
  /database_setup_complete.sql - Script unificado de configuração do banco
```

## Solução de Problemas

### Erros com Imagens de Avatar

Se você encontrar erros ao carregar avatares do Google ou outros provedores, verifique:
1. Se configurou os domínios no `next.config.ts` conforme instruções acima
2. Como alternativa, use a tag `<img>` tradicional em vez do componente `<Image>` do Next.js

### Erro de Sincronização de Perfil

Se ocorrerem erros durante a sincronização de perfil, verifique:
1. Se a tabela `profiles` possui todas as colunas necessárias (`email`, `name`, `full_name`, `avatar_url`)
2. Se as permissões do Supabase estão configuradas corretamente
3. Verifique os logs do console para mensagens detalhadas

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
