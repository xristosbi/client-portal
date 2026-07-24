import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Icon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Σύντομα διαθέσιμο</p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              {description}
            </p>
            <Badge variant="secondary">Σε ανάπτυξη</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
