import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileOrRedirect();

  if (profile.role !== "admin") {
    redirect("/portal");
  }

  const supabase = createClient();
  const { data: unreadTickets } = await supabase.rpc("unread_ticket_count");

  const navItems: NavItem[] = [
    { href: "/admin", label: "Επισκόπηση", icon: "dashboard" },
    { href: "/admin/clients", label: "Πελάτες", icon: "users" },
    { href: "/admin/team", label: "Προσωπικό", icon: "team" },
    { href: "/admin/payments", label: "Πληρωμές", icon: "payments" },
    { href: "/admin/chat", label: "Συνομιλίες", icon: "chat" },
    {
      href: "/admin/support",
      label: "Υποστήριξη",
      icon: "support",
      badge: unreadTickets ?? 0,
    },
    {
      href: "/admin/notifications",
      label: "Ειδοποιήσεις",
      icon: "notifications",
    },
    { href: "/admin/settings", label: "Ρυθμίσεις", icon: "settings" },
  ];

  return (
    <PortalShell profile={profile} navItems={navItems}>
      {children}
    </PortalShell>
  );
}
