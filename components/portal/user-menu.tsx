"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types";

function initialsOf(profile: Profile) {
  const source = profile.full_name || profile.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ profile }: { profile: Profile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold">
        <Avatar className="h-8 w-8 border border-zinc-700">
          <AvatarFallback className="bg-zinc-800 text-xs font-semibold text-gold">
            {initialsOf(profile)}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-zinc-100">
            {profile.full_name || profile.email}
          </span>
          <span className="truncate text-xs text-zinc-500">
            {profile.role === "admin" ? "Διαχειριστής" : profile.company_name}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">
            {profile.full_name || "—"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {profile.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut />
              Αποσύνδεση
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
