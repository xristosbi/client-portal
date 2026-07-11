import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { NotificationTypeBadge } from "@/components/shared/status-badges";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types";
import { deleteNotification } from "./actions";
import {
  NewNotificationDialog,
  type RecipientOption,
} from "./new-notification-dialog";

export const metadata: Metadata = {
  title: "Ειδοποιήσεις",
};

interface NotificationRow extends AppNotification {
  client: {
    full_name: string | null;
    company_name: string | null;
    email: string;
  } | null;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminNotificationsPage() {
  const supabase = createClient();

  const [{ data: notificationData }, { data: clientData }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*, client:profiles(full_name, company_name, email)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, company_name, email")
      .eq("role", "client")
      .order("full_name"),
  ]);

  const notifications = (notificationData ?? []) as NotificationRow[];

  const clients: RecipientOption[] = (clientData ?? []).map((client) => ({
    id: client.id,
    label:
      [client.full_name, client.company_name].filter(Boolean).join(" — ") ||
      client.email,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ειδοποιήσεις
          </h1>
          <p className="mt-1 text-muted-foreground">
            Στείλτε ενημερώσεις στους πελάτες σας — σε έναν ή σε όλους.
          </p>
        </div>
        <NewNotificationDialog clients={clients} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Απεσταλμένες ({notifications.length})
          </CardTitle>
          <CardDescription>
            Οι πιο πρόσφατες ειδοποιήσεις εμφανίζονται πρώτες.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν έχουν σταλεί ακόμη ειδοποιήσεις.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Τίτλος</TableHead>
                  <TableHead>Τύπος</TableHead>
                  <TableHead>Παραλήπτης</TableHead>
                  <TableHead>Στάλθηκε</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <span className="font-medium">{notification.title}</span>
                      <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <NotificationTypeBadge type={notification.type} />
                    </TableCell>
                    <TableCell>
                      {notification.client_id
                        ? notification.client?.full_name ||
                          notification.client?.company_name ||
                          notification.client?.email ||
                          "—"
                        : "Όλοι"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(notification.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmDeleteDialog
                        action={deleteNotification.bind(null, notification.id)}
                        description={`Σίγουρα θες να διαγράψεις την ειδοποίηση «${notification.title}»;`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
