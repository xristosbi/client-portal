import type { Metadata } from "next";
import { FileSignature } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const metadata: Metadata = {
  title: "Συμφωνία",
};

export default function PortalAgreementPage() {
  return (
    <ComingSoon
      title="Συμφωνία"
      description="Η συμφωνία συνεργασίας σας θα είναι διαθέσιμη εδώ σε επόμενη φάση."
      icon={FileSignature}
    />
  );
}
