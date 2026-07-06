import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Πίνακας Διαχείρισης",
};

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const { count: clientCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Πίνακας Διαχείρισης
        </h1>
        <p className="mt-1 text-muted-foreground">
          Συνολική εικόνα των πελατών και της δραστηριότητας της Imperial
          Automations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ενεργοί Πελάτες
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{clientCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Λογαριασμοί πελατών στην πύλη
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Διαχείριση Πελατών</CardTitle>
          <CardDescription>
            Δείτε όλους τους πελάτες σας και τα στοιχεία των λογαριασμών τους.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/clients">
              Προβολή πελατών
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
