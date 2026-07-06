import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";

const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Επισκόπηση", icon: "dashboard" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileOrRedirect();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  return (
    <PortalShell profile={profile} navItems={CLIENT_NAV}>
      {children}
    </PortalShell>
  );
}
