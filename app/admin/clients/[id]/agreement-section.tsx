"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ExternalLink, FileText, Loader2, Pencil, Type } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/shared/markdown-content";
import type { Agreement, AgreementContentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { saveAgreement, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = { status: "idle" };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Αποθήκευση…
        </>
      ) : isEdit ? (
        "Αποθήκευση"
      ) : (
        "Δημιουργία Συμφωνίας"
      )}
    </Button>
  );
}

function AgreementForm({
  clientId,
  agreement,
  onDone,
}: {
  clientId: string;
  agreement: Agreement | null;
  onDone: () => void;
}) {
  const [state, formAction] = useFormState(saveAgreement, initialState);
  const [contentType, setContentType] = useState<AgreementContentType>(
    agreement?.content_type ?? "markdown"
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Η συμφωνία αποθηκεύτηκε.");
      onDone();
    }
  }, [state.status, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      {agreement && (
        <input type="hidden" name="agreement_id" value={agreement.id} />
      )}
      <input type="hidden" name="content_type" value={contentType} />

      <div className="space-y-2">
        <Label>Τύπος Συμφωνίας</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={contentType === "markdown" ? "default" : "outline"}
            size="sm"
            onClick={() => setContentType("markdown")}
          >
            <Type />
            Markdown κείμενο
          </Button>
          <Button
            type="button"
            variant={contentType === "pdf" ? "default" : "outline"}
            size="sm"
            onClick={() => setContentType("pdf")}
          >
            <FileText />
            Ανέβασμα PDF
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agreement_title">Τίτλος *</Label>
        <Input
          id="agreement_title"
          name="title"
          placeholder="π.χ. Συμφωνία Συνεργασίας"
          defaultValue={agreement?.title ?? undefined}
          required
        />
      </div>

      <div className={cn(contentType !== "markdown" && "hidden")}>
        <div className="space-y-2">
          <Label htmlFor="agreement_content">Κείμενο Συμφωνίας *</Label>
          <Textarea
            id="agreement_content"
            name="content_markdown"
            rows={14}
            placeholder={"# Συμφωνία Συνεργασίας\n\n## 1. Αντικείμενο\n\n…"}
            defaultValue={agreement?.content_markdown ?? undefined}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Υποστηρίζεται Markdown: επικεφαλίδες (#), έντονα (**κείμενο**),
            λίστες (-), πίνακες.
          </p>
        </div>
      </div>

      <div className={cn(contentType !== "pdf" && "hidden")}>
        <div className="space-y-2">
          <Label htmlFor="agreement_file">Αρχείο PDF</Label>
          <Input
            id="agreement_file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
          />
          <p className="text-xs text-muted-foreground">
            Έως 10MB.
            {agreement?.content_type === "pdf" &&
              " Αφήστε το κενό για να διατηρηθεί το υπάρχον αρχείο."}
          </p>
        </div>
      </div>

      {state.status === "error" && state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton isEdit={Boolean(agreement)} />
        {agreement && (
          <Button type="button" variant="outline" onClick={onDone}>
            Άκυρο
          </Button>
        )}
      </div>
    </form>
  );
}

export function AgreementSection({
  clientId,
  agreement,
  pdfUrl,
}: {
  clientId: string;
  agreement: Agreement | null;
  pdfUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (!agreement || editing) {
    return (
      <AgreementForm
        clientId={clientId}
        agreement={agreement}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{agreement.title}</span>
          <Badge variant="secondary">
            {agreement.content_type === "markdown" ? "Markdown" : "PDF"}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil />
          Επεξεργασία
        </Button>
      </div>

      {agreement.content_type === "markdown" && agreement.content_markdown ? (
        <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/20 p-5">
          <MarkdownContent content={agreement.content_markdown} />
        </div>
      ) : pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
        >
          Προβολή PDF
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">
          Το αρχείο δεν είναι διαθέσιμο.
        </p>
      )}
    </div>
  );
}
