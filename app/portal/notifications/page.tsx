import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const metadata: Metadata = {
  title: "Ειδοποιήσεις",
};

export default function PortalNotificationsPage() {
  return (
    <ComingSoon
      title="Ειδοποιήσεις"
      description="Οι ειδοποιήσεις σας θα εμφανίζονται εδώ σε επόμενη φάση."
      icon={Bell}
    />
  );
}
