export type UserRole = 'ADMIN' | 'VETERINARIAN' | 'OWNER';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  identification_number: string;
  role: UserRole;
  password_changed: boolean;
  terms_accepted_at: string | null;
}

export interface PrivacyPolicy {
  id: number;
  version: string;
  content: string;
  effective_date: string;
}