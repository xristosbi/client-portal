"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moveMilestone } from "./actions";

export function MilestoneMoveButtons({
  milestoneId,
  isFirst,
  isLast,
}: {
  milestoneId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveMilestone(milestoneId, direction);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label="Μετακίνηση πάνω"
        disabled={isFirst || pending}
        onClick={() => move("up")}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label="Μετακίνηση κάτω"
        disabled={isLast || pending}
        onClick={() => move("down")}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
