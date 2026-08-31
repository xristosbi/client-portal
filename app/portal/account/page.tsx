import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { getProfileOrRedirect } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ο Λογαριασμός μου",
};

export default async function PortalAccountPage() {
  const profile = await getProfileOrRedirect();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ο Λογαριασμός μου
        </h1>
        <p className="mt-1 text-muted-foreground">
          Τα στοιχεία του λογαριασμού σας και ο κωδικός πρόσβασης.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Στοιχεία</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b pb-3">
            <span className="text-muted-foreground">Ονοματεπώνυμο</span>
            <span className="font-medium">{profile.full_name || "—"}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b pb-3">
            <span className="text-muted-foreground">Επιχείρηση</span>
            <span className="font-medium">{profile.company_name || "—"}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-muted-foreground">Email σύνδεσης</span>
            <span className="font-medium">{profile.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Αλλαγή Κωδικού</CardTitle>
          <CardDescription>
            Επιλέξτε έναν νέο κωδικό πρόσβασης για τον λογαριασμό σας.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm idPrefix="account" />
        </CardContent>
      </Card>
    </div>
  );
}
