export type UserRole = "admin" | "client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
