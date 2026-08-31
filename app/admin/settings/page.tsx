import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Ρυθμίσεις",
};

export default async function AdminSettingsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings = data as AppSettings | null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ρυθμίσεις</h1>
        <p className="mt-1 text-muted-foreground">
          Το βίντεο και το μήνυμα καλωσορίσματος που βλέπουν οι πελάτες στην
          αρχική σελίδα της πύλης τους.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Καλωσόρισμα Πύλης Πελατών
          </CardTitle>
          <CardDescription>
            Εμφανίζεται σε όλους τους πελάτες που δεν έχουν δικό τους
            προσωποποιημένο βίντεο.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Αλλαγή Κωδικού</CardTitle>
          <CardDescription>
            Ο κωδικός πρόσβασης του δικού σας λογαριασμού διαχειριστή.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm idPrefix="admin" />
        </CardContent>
      </Card>
    </div>
  );
}
