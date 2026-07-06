import { Badge } from "@/components/ui/badge";
import {
  MILESTONE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type MilestoneStatus,
  type ProjectStatus,
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
