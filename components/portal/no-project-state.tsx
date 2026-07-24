import { Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function NoProjectState() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Rocket className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            Το project σου θα ξεκινήσει σύντομα
          </p>
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            Μόλις ξεκινήσει το έργο σας, εδώ θα βλέπετε την πρόοδο του.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
