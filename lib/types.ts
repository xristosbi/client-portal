export type UserRole = "admin" | "client";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type PaymentMethod = "stripe_auto" | "cash_manual";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: UserRole;
  has_subscription: boolean;
  subscription_amount: number | null;
  subscription_status: SubscriptionStatus;
  payment_method: PaymentMethod | null;
  /** Reserved for a future per-client personalized welcome video. */
  personal_welcome_video_url: string | null;
  created_at: string;
  updated_at: string;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Ενεργή",
  paused: "Σε παύση",
  cancelled: "Ακυρωμένη",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe_auto: "Stripe (αυτόματο)",
  cash_manual: "Μετρητά / Χειροκίνητο",
};

export type ProjectStatus =
  | "onboarding"
  | "in_progress"
  | "review"
  | "completed"
  | "paused";

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  sort_order: number;
  created_at: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  onboarding: "Έναρξη συνεργασίας",
  in_progress: "Σε εξέλιξη",
  review: "Σε αξιολόγηση",
  completed: "Ολοκληρωμένο",
  paused: "Σε παύση",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Σε αναμονή",
  in_progress: "Σε εξέλιξη",
  completed: "Ολοκληρώθηκε",
};

export interface AppSettings {
  id: number;
  welcome_video_url: string | null;
  welcome_message: string | null;
  updated_at: string;
}
