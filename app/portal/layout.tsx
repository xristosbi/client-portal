import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";

const CLIENT_NAV: NavItem[] = [
  { href: "/portal", label: "Αρχική", icon: "home" },
  { href: "/portal/project", label: "Project & Χρονοδιάγραμμα", icon: "project" },
  { href: "/portal/invoices", label: "Τιμολόγια", icon: "invoices" },
  { href: "/portal/files", label: "Αρχεία", icon: "files" },
  { href: "/portal/agreement", label: "Συμφωνία", icon: "agreement" },
  { href: "/portal/notifications", label: "Ειδοποιήσεις", icon: "notifications" },
  { href: "/portal/support", label: "Υποστήριξη", icon: "support" },
];

export default async function PortalLayout({
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
