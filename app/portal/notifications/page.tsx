import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types";
import { NotificationItem } from "./notification-item";

export const metadata: Metadata = {
  title: "Ειδοποιήσεις",
};

export default async function PortalNotificationsPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  // RLS returns the client's own notifications plus broadcasts.
  const [{ data: notificationData }, { data: readData }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("client_id", profile.id),
  ]);

  const notifications = (notificationData ?? []) as AppNotification[];
  const readIds = new Set(
    (readData ?? []).map((read) => read.notification_id as string)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ειδοποιήσεις</h1>
        <p className="mt-1 text-muted-foreground">
          Ενημερώσεις από την Imperial Automations.
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                <Bell className="h-7 w-7 text-gold" />
              </div>
              <p className="text-sm font-medium">
                Δεν έχεις ακόμα ειδοποιήσεις
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isRead={readIds.has(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
