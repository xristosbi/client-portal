import { Badge } from "@/components/ui/badge";
import {
  MILESTONE_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type MilestoneStatus,
  type NotificationType,
  type ProjectStatus,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";

const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  onboarding: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  review: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  paused: "bg-zinc-200 text-zinc-700 hover:bg-zinc-200",
};

const MILESTONE_STATUS_CLASSES: Record<MilestoneStatus, string> = {
  pending: "bg-zinc-200 text-zinc-700 hover:bg-zinc-200",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={`border-transparent ${PROJECT_STATUS_CLASSES[status]}`}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  return (
    <Badge
      className={`border-transparent ${MILESTONE_STATUS_CLASSES[status]}`}
    >
      {MILESTONE_STATUS_LABELS[status]}
    </Badge>
  );
}

const TICKET_STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  in_progress: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  resolved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  closed: "bg-zinc-200 text-zinc-700 hover:bg-zinc-200",
};

const TICKET_PRIORITY_CLASSES: Record<TicketPriority, string> = {
  low: "bg-zinc-200 text-zinc-700 hover:bg-zinc-200",
  normal: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  high: "bg-red-100 text-red-700 hover:bg-red-100",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={`border-transparent ${TICKET_STATUS_CLASSES[status]}`}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <Badge
      className={`border-transparent ${TICKET_PRIORITY_CLASSES[priority]}`}
    >
      {TICKET_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const NOTIFICATION_TYPE_CLASSES: Record<NotificationType, string> = {
  info: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  payment: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  milestone: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  support: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  return (
    <Badge className={`border-transparent ${NOTIFICATION_TYPE_CLASSES[type]}`}>
      {NOTIFICATION_TYPE_LABELS[type]}
    </Badge>
  );
}
