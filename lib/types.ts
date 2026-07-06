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
