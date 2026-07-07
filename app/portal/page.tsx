import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, CreditCard, Rocket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MilestoneStatusBadge,
  ProjectStatusBadge,
} from "@/components/shared/status-badges";
import { WelcomeVideo } from "@/components/portal/welcome-video";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { athensToday, currencyFormatter, nextBillingDate } from "@/lib/finance";
import type { AppSettings, Milestone, Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Αρχική",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function PortalHomePage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  const [{ data: projectData }, { data: settingsData }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", profile.id)
      .maybeSingle(),
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const project = projectData as Project | null;
  const settings = settingsData as AppSettings | null;

  let nextMilestone: Milestone | null = null;
  if (project) {
    const { data: milestoneData } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", project.id)
      .in("status", ["pending", "in_progress"])
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    nextMilestone = milestoneData as Milestone | null;
  }

  const displayName = profile.full_name || profile.company_name || "";
  const videoUrl =
    profile.personal_welcome_video_url || settings?.welcome_video_url || null;

  const hasActiveSubscription =
    profile.has_subscription &&
    profile.subscription_status === "active" &&
    profile.subscription_amount != null;

  const nextPaymentLabel = hasActiveSubscription
    ? profile.subscription_billing_day
      ? longDateFormatter.format(
          new Date(
            `${nextBillingDate(profile.subscription_billing_day, athensToday())}T00:00:00`
          )
        )
      : null
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Καλώς ήρθατε{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Αυτή είναι η προσωπική σας πύλη στην Imperial Automations.
        </p>
      </div>

      {videoUrl && <WelcomeVideo url={videoUrl} />}

      {project ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">{project.name}</CardTitle>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </div>
            <ProjectStatusBadge status={project.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            {nextMilestone ? (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <CalendarClock className="h-4 w-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Επόμενο βήμα
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{nextMilestone.title}</span>
                    <MilestoneStatusBadge status={nextMilestone.status} />
                  </div>
                  {nextMilestone.due_date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Προθεσμία:{" "}
                      {dateFormatter.format(
                        new Date(`${nextMilestone.due_date}T00:00:00`)
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Δεν υπάρχει προγραμματισμένο επόμενο βήμα αυτή τη στιγμή.
              </p>
            )}

            <Button asChild variant="outline">
              <Link href="/portal/project">
                Δείτε το χρονοδιάγραμμα
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                Μόλις ξεκινήσει το έργο σας, εδώ θα βλέπετε την πρόοδο και τα
                επόμενα βήματα.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Επόμενη Πληρωμή
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <CreditCard className="h-4 w-4 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            {hasActiveSubscription ? (
              <>
                <div className="text-2xl font-semibold">
                  {currencyFormatter.format(
                    Number(profile.subscription_amount)
                  )}
                  <span className="text-sm font-normal text-muted-foreground">
                    /μήνα
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nextPaymentLabel
                    ? `επόμενη χρέωση ${nextPaymentLabel}`
                    : "Ενεργή μηνιαία συνδρομή"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Καμία εκκρεμής πληρωμή
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Τελευταία Ειδοποίηση
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Bell className="h-4 w-4 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Καμία νέα ειδοποίηση
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
