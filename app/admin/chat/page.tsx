import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Συνομιλίες",
};

export default function AdminChatPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Συνομιλίες</h1>
        <p className="mt-1 text-muted-foreground">
          Επικοινωνία με τους πελάτες σας μέσα από την πύλη.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <MessagesSquare className="h-7 w-7 text-gold" />
            </div>
            <p className="text-sm font-medium">Σύντομα διαθέσιμο</p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Οι συνομιλίες με τους πελάτες σας θα είναι διαθέσιμες σε
              επόμενη φάση της πύλης.
            </p>
            <Badge variant="secondary">Σε ανάπτυξη</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
