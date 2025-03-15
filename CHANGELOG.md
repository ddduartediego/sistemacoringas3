# Changelog do Sistema Coringas

## Versão 1.1.0 (atual)
- Migração da biblioteca @supabase/auth-helpers-nextjs para @supabase/ssr
- Melhoria na gestão de dados e autenticação
- Refatoração do middleware para suporte a novas rotas
- Atualização da interface do usuário

## Versão 1.0.0
- Uso de @supabase/ssr para integração do Supabase com Next.js
- Layout principal do sistema
- Sistema de autenticação básico
- Área de membros com perfil
- Painel administrativo para aprovação de novos membros

### Adicionado
- Configuração inicial do projeto com Next.js, React e Supabase
- Sistema de autenticação com Google via Supabase
- Proteção de rotas com middleware
- Layout principal do sistema com Sidebar responsiva e Header
- Página de dashboard com resumos e estatísticas
- Páginas de login e registro usando autenticação Google
- Perfil de usuário com informações pessoais
- Tipos TypeScript para todas as entidades do sistema
- Integrações com a API do Supabase para manipulação de dados
- README com instruções completas de instalação e configuração

### Detalhes Técnicos
- Uso de auth-helpers-nextjs para integração do Supabase com Next.js 
- Context API para gerenciar estado de autenticação
- Componentes reutilizáveis para UI consistente
- TailwindCSS para estilização
- Componentes responsivos para mobile e desktop
- Integração com banco de dados PostgreSQL via Supabase 