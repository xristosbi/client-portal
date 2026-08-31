import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileOrRedirect();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const supabase = createClient();
  const [{ data: unreadTickets }, { data: unreadNotifications }] =
    await Promise.all([
      supabase.rpc("unread_ticket_count"),
      supabase.rpc("unread_notification_count"),
    ]);

  const navItems: NavItem[] = [
    { href: "/portal", label: "Αρχική", icon: "home" },
    {
      href: "/portal/project",
      label: "Project & Χρονοδιάγραμμα",
      icon: "project",
    },
    { href: "/portal/invoices", label: "Τιμολόγια", icon: "invoices" },
    { href: "/portal/files", label: "Αρχεία", icon: "files" },
    { href: "/portal/agreement", label: "Συμφωνία", icon: "agreement" },
    {
      href: "/portal/notifications",
      label: "Ειδοποιήσεις",
      icon: "notifications",
      badge: unreadNotifications ?? 0,
    },
    {
      href: "/portal/support",
      label: "Υποστήριξη",
      icon: "support",
      badge: unreadTickets ?? 0,
    },
    { href: "/portal/account", label: "Ο Λογαριασμός μου", icon: "account" },
  ];

  return (
    <PortalShell profile={profile} navItems={navItems}>
      {children}
    </PortalShell>
  );
}
