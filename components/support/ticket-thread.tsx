import { cn } from "@/lib/utils";

export interface ThreadMessage {
  id: string;
  message: string;
  created_at: string;
  senderLabel: string;
  /** Right-aligns the bubble (the viewer's own messages). */
  isOwn: boolean;
}

const timestampFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function TicketThread({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Δεν υπάρχουν ακόμη μηνύματα.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", message.isOwn ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-lg px-4 py-3 sm:max-w-[70%]",
              message.isOwn
                ? "bg-zinc-900 text-zinc-50"
                : "border bg-muted/40"
            )}
          >
            <div
              className={cn(
                "mb-1 flex flex-wrap items-baseline gap-x-2 text-xs",
                message.isOwn ? "text-zinc-400" : "text-muted-foreground"
              )}
            >
              <span className="font-medium">{message.senderLabel}</span>
              <span>{timestampFormatter.format(new Date(message.created_at))}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{message.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
