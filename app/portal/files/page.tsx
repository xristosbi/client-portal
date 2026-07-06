import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const metadata: Metadata = {
  title: "Αρχεία",
};

export default function PortalFilesPage() {
  return (
    <ComingSoon
      title="Αρχεία"
      description="Θα μπορείτε να ανεβάζετε και να βλέπετε αρχεία απευθείας εδώ σε επόμενη φάση."
      icon={FolderOpen}
    />
  );
}
