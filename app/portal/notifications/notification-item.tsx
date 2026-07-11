"use client";

import { useTransition } from "react";
import { NotificationTypeBadge } from "@/components/shared/status-badges";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationItem({
  notification,
  isRead,
}: {
  notification: AppNotification;
  isRead: boolean;
}) {
  const [, startTransition] = useTransition();

  function handleClick() {
    if (isRead) return;
    startTransition(async () => {
      await markNotificationRead(notification.id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        isRead
          ? "bg-transparent text-muted-foreground"
          : "border-gold/40 bg-gold/5 hover:bg-gold/10"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {!isRead && (
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full bg-gold"
          />
        )}
        <span
          className={cn(
            "text-sm",
            isRead ? "font-medium" : "font-semibold text-foreground"
          )}
        >
          {notification.title}
        </span>
        <NotificationTypeBadge type={notification.type} />
        <span className="ml-auto text-xs text-muted-foreground">
          {dateFormatter.format(new Date(notification.created_at))}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 whitespace-pre-wrap text-sm",
          isRead ? "text-muted-foreground" : "text-foreground/80"
        )}
      >
        {notification.message}
      </p>
    </button>
  );
}
