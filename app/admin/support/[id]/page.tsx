import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TicketPriorityBadge } from "@/components/shared/status-badges";
import { ReplyForm } from "@/components/support/reply-form";
import {
  TicketThread,
  type ThreadMessage,
} from "@/components/support/ticket-thread";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/types";
import { adminReplyToTicket } from "../actions";
import { TicketStatusSelect } from "./status-select";

export const metadata: Metadata = {
  title: "Αίτημα Υποστήριξης",
};

interface TicketDetail extends SupportTicket {
  client: {
    full_name: string | null;
    company_name: string | null;
    email: string;
  } | null;
}

interface MessageWithSender {
  id: string;
  message: string;
  created_at: string;
  sender_id: string | null;
  sender: { full_name: string | null; role: string } | null;
}

export default async function AdminTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select("*, client:profiles(full_name, company_name, email)")
    .eq("id", params.id)
    .maybeSingle();

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as TicketDetail;
  const clientLabel =
    ticket.client?.full_name ||
    ticket.client?.company_name ||
    ticket.client?.email ||
    "Πελάτης";

  const { data: messageData } = await supabase
    .from("ticket_messages")
    .select("*, sender:profiles(full_name, role)")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  const messages: ThreadMessage[] = (
    (messageData ?? []) as MessageWithSender[]
  ).map((message) => {
    const isAdminMessage = message.sender?.role === "admin";
    return {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      isOwn: message.sender_id === profile.id,
      senderLabel: isAdminMessage
        ? "Imperial Automations"
        : message.sender?.full_name || clientLabel,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/support">
            <ArrowLeft />
            Πίσω στην Υποστήριξη
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {ticket.subject}
              </h1>
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <p className="mt-1 text-muted-foreground">{clientLabel}</p>
          </div>
          <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Συνομιλία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TicketThread messages={messages} />
          <Separator />
          <ReplyForm ticketId={ticket.id} action={adminReplyToTicket} />
        </CardContent>
      </Card>
    </div>
  );
}
