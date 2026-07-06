import type { Metadata } from "next";
import { Check, Rocket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badges";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Milestone, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Project & Χρονοδιάγραμμα",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return null;
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export default async function PortalProjectPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", profile.id)
    .maybeSingle();

  const project = projectData as Project | null;

  let milestones: Milestone[] = [];
  if (project) {
    const { data: milestoneData } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    milestones = (milestoneData ?? []) as Milestone[];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Project & Χρονοδιάγραμμα
        </h1>
        <p className="mt-1 text-muted-foreground">
          Η πρόοδος του έργου σας βήμα προς βήμα.
        </p>
      </div>

      {!project ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                <Rocket className="h-7 w-7 text-gold" />
              </div>
              <p className="text-sm font-medium">
                Το project σου θα ξεκινήσει σύντομα
              </p>
              <p className="max-w-sm text-center text-xs text-muted-foreground">
                Μόλις ξεκινήσει το έργο σας, εδώ θα βλέπετε την πρόοδο και το
                χρονοδιάγραμμα.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </div>
              <ProjectStatusBadge status={project.status} />
            </CardHeader>
            {(project.start_date || project.target_end_date) && (
              <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                {project.start_date && (
                  <span>Έναρξη: {formatDate(project.start_date)}</span>
                )}
                {project.target_end_date && (
                  <span>
                    Στόχος ολοκλήρωσης: {formatDate(project.target_end_date)}
                  </span>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Χρονοδιάγραμμα</CardTitle>
              <CardDescription>
                Τα βήματα του έργου σας, με τη σειρά.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Δεν υπάρχουν ακόμη βήματα στο χρονοδιάγραμμα.
                </p>
              ) : (
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {milestones.map((milestone) => {
                    const isCompleted = milestone.status === "completed";
                    const isInProgress = milestone.status === "in_progress";

                    return (
                      <li key={milestone.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[1.6rem] flex h-6 w-6 items-center justify-center rounded-full border-2",
                            isCompleted
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : isInProgress
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-border bg-background text-muted-foreground"
                          )}
                        >
                          {isCompleted && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {milestone.title}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isCompleted
                                ? "text-emerald-600"
                                : isInProgress
                                  ? "text-gold"
                                  : "text-muted-foreground"
                            )}
                          >
                            {isCompleted
                              ? "Ολοκληρώθηκε"
                              : isInProgress
                                ? "Σε εξέλιξη"
                                : "Σε αναμονή"}
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        )}
                        {milestone.due_date && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Προθεσμία: {formatDate(milestone.due_date)}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
