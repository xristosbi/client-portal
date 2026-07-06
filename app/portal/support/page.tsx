import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const metadata: Metadata = {
  title: "Υποστήριξη",
};

export default function PortalSupportPage() {
  return (
    <ComingSoon
      title="Υποστήριξη"
      description="Θα μπορείτε να στέλνετε αίτημα υποστήριξης απευθείας εδώ σε επόμενη φάση."
      icon={LifeBuoy}
    />
  );
}
