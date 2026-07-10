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
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badges";
import { ReplyForm } from "@/components/support/reply-form";
import {
  TicketThread,
  type ThreadMessage,
} from "@/components/support/ticket-thread";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket, TicketMessage } from "@/lib/types";
import { replyToTicket } from "../actions";

export const metadata: Metadata = {
  title: "Αίτημα Υποστήριξης",
};

export default async function PortalTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  // RLS already scopes this to the client's own tickets; the eq() is
  // defense in depth.
  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", params.id)
    .eq("client_id", profile.id)
    .maybeSingle();

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as SupportTicket;

  const { data: messageData } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  // Clients can't read other profiles via RLS, so sender labels are
  // derived from the id: their own messages vs everything else (admin).
  const messages: ThreadMessage[] = ((messageData ?? []) as TicketMessage[]).map(
    (message) => ({
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      isOwn: message.sender_id === profile.id,
      senderLabel:
        message.sender_id === profile.id ? "Εσείς" : "Imperial Automations",
    })
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/portal/support">
            <ArrowLeft />
            Πίσω στην Υποστήριξη
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {ticket.subject}
          </h1>
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Συνομιλία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TicketThread messages={messages} />
          <Separator />
          <ReplyForm ticketId={ticket.id} action={replyToTicket} />
        </CardContent>
      </Card>
    </div>
  );
}
