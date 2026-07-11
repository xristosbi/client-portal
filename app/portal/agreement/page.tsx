import type { Metadata } from "next";
import { ExternalLink, FileSignature, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { getProfileOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Agreement } from "@/lib/types";

export const metadata: Metadata = {
  title: "Συμφωνία",
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PortalAgreementPage() {
  const profile = await getProfileOrRedirect();
  const supabase = createClient();

  // RLS scopes this to the client's own rows; most recent row wins.
  const { data } = await supabase
    .from("agreements")
    .select("*")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const agreement = data as Agreement | null;

  let pdfUrl: string | null = null;
  if (agreement?.content_type === "pdf" && agreement.file_path) {
    const { data: signed } = await supabase.storage
      .from("agreements")
      .createSignedUrl(agreement.file_path, 60 * 60);
    pdfUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Συμφωνία</h1>
        <p className="mt-1 text-muted-foreground">
          Η συμφωνία συνεργασίας σας με την Imperial Automations.
        </p>
      </div>

      {!agreement ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                <FileSignature className="h-7 w-7 text-gold" />
              </div>
              <p className="text-sm font-medium">
                Η συμφωνία σου θα είναι διαθέσιμη εδώ σύντομα.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{agreement.title}</CardTitle>
            <CardDescription>
              Τελευταία ενημέρωση:{" "}
              {dateFormatter.format(new Date(agreement.updated_at))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agreement.content_type === "markdown" &&
            agreement.content_markdown ? (
              <MarkdownContent content={agreement.content_markdown} />
            ) : pdfUrl ? (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                  <FileText className="h-6 w-6 text-gold" />
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                >
                  Προβολή PDF
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="text-xs text-muted-foreground">
                  Ο σύνδεσμος λήγει μετά από 1 ώρα για λόγους ασφαλείας.
                </p>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Το αρχείο δεν είναι διαθέσιμο αυτή τη στιγμή.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
