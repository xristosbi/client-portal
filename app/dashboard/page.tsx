import type { Metadata } from "next";
import { FolderKanban, MessageSquare, Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfileOrRedirect } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Επισκόπηση",
};

const UPCOMING_SECTIONS = [
  {
    icon: FolderKanban,
    title: "Το έργο σας",
    description:
      "Παρακολουθήστε την πρόοδο του έργου σας βήμα προς βήμα.",
  },
  {
    icon: Receipt,
    title: "Πληρωμές & Τιμολόγια",
    description:
      "Δείτε και εξοφλήστε τα τιμολόγιά σας γρήγορα και με ασφάλεια.",
  },
  {
    icon: MessageSquare,
    title: "Επικοινωνία & Αρχεία",
    description:
      "Στείλτε μας μηνύματα και αρχεία απευθείας μέσα από την πύλη.",
  },
];

export default async function DashboardPage() {
  const profile = await getProfileOrRedirect();
  const displayName = profile.full_name || profile.company_name || "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Καλώς ήρθατε{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Αυτή είναι η προσωπική σας πύλη στην Imperial Automations. Εδώ θα
          βρίσκετε το έργο σας, τις πληρωμές και την επικοινωνία μας.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UPCOMING_SECTIONS.map((section) => (
          <Card key={section.title} className="relative">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                <section.icon className="h-5 w-5 text-gold" />
              </div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Σύντομα διαθέσιμο</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
