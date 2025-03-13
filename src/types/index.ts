export type UserType = 'member' | 'admin' | 'inativo';

export type MemberStatus = 'calouro' | 'veterano' | 'aposentado' | 'patrocinador' | 'comercial';

export type FinancialStatus = 'ok' | 'pendente';

export type TeamRole = 'rua' | 'qg' | 'lideranca';

export type ShirtSize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG' | 'XXG';

export type Gender = 'masculino' | 'feminino' | 'prefiro_nao_responder';

export interface Charge {
  id: string;
  member_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'paid' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  nickname: string;
  status: MemberStatus;
  type: UserType;
  team_role: TeamRole;
  financial_status: FinancialStatus;
  shirt_size: string;
  birth_date: string;
  cpf: string;
  gender: string;
  phone: string;
  profession: string;
  pending_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  aud?: string;
  created_at?: string;
  updated_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  [key: string]: any;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string[];
  created_at: string;
  updated_at: string;
}

export interface UserMetadata {
  avatar_url?: string;
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  picture?: string;
  provider_id?: string;
  sub?: string;
} 