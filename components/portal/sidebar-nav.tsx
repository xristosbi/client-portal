"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  FileSignature,
  FolderKanban,
  FolderOpen,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Settings,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  team: UserCog,
  payments: CreditCard,
  home: Home,
  project: FolderKanban,
  invoices: Receipt,
  files: FolderOpen,
  agreement: FileSignature,
  notifications: Bell,
  support: LifeBuoy,
  settings: Settings,
  account: UserCircle,
};

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** Unread count pill; hidden when 0 or undefined. */
  badge?: number;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Highlight only the most specific matching item, so e.g. /admin does not
  // stay active while visiting /admin/clients.
  const activeHref = items
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-gold/10 text-gold"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {(item.badge ?? 0) > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-semibold text-gold-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
