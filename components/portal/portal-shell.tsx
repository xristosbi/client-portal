import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarNav, type NavItem } from "@/components/portal/sidebar-nav";
import { UserMenu } from "@/components/portal/user-menu";
import type { Profile } from "@/lib/types";

interface PortalShellProps {
  profile: Profile;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function PortalShell({ profile, navItems, children }: PortalShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-100/60">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
            <Crown className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-50">
              Imperial Automations
            </p>
            <p className="text-xs text-zinc-500">Πύλη Πελατών</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav items={navItems} />
        </div>

        <div className="border-t border-zinc-800 p-3">
          <UserMenu profile={profile} />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <span className="text-sm font-semibold text-zinc-50">
              Imperial Automations
            </span>
            {profile.role === "admin" && (
              <Badge className="bg-gold/15 text-gold hover:bg-gold/15">
                Admin
              </Badge>
            )}
          </div>
          <div className="w-40">
            <UserMenu profile={profile} />
          </div>
        </header>

        {/* Mobile nav */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 md:hidden">
          <SidebarNav items={navItems} />
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
