import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Επισκόπηση", icon: "dashboard" },
  { href: "/admin/clients", label: "Πελάτες", icon: "users" },
  { href: "/admin/team", label: "Προσωπικό", icon: "team" },
  { href: "/admin/payments", label: "Πληρωμές", icon: "payments" },
  { href: "/admin/chat", label: "Συνομιλίες", icon: "chat" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileOrRedirect();

  if (profile.role !== "admin") {
    redirect("/portal");
  }

  return (
    <PortalShell profile={profile} navItems={ADMIN_NAV}>
      {children}
    </PortalShell>
  );
}
