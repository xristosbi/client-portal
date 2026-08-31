import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import {
  ProjectFilesList,
  type ProjectFileWithUrl,
} from "@/components/shared/project-files-list";
import {
  MilestoneStatusBadge,
  ProjectStatusBadge,
} from "@/components/shared/status-badges";
import { createClient } from "@/lib/supabase/server";
import { currencyFormatter } from "@/lib/finance";
import type {
  Agreement,
  Milestone,
  Profile,
  Project,
  ProjectFile,
} from "@/lib/types";
import {
  createAdminProjectFile,
  deleteClientInvoice,
  deleteMilestone,
} from "./actions";
import { AgreementSection } from "./agreement-section";
import {
  EditMilestoneDialog,
  NewMilestoneDialog,
} from "./milestone-dialog";
import { MilestoneMoveButtons } from "./milestone-move-buttons";
import { ProjectForm } from "./project-form";

export const metadata: Metadata = {
  title: "Project Πελάτη",
};

interface InvoiceRow {
  id: string;
  amount: number;
  description: string;
  invoice_date: string;
  file_path: string;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return "—";
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: clientData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("role", "client")
    .maybeSingle();

  if (!clientData) {
    notFound();
  }

  const client = clientData as Profile;

  const [{ data: projectData }, { data: invoiceData }, { data: agreementData }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle(),
      supabase
        .from("client_invoices")
        .select("id, amount, description, invoice_date, file_path")
        .eq("client_id", client.id)
        .order("invoice_date", { ascending: false }),
      supabase
        .from("agreements")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const project = projectData as Project | null;
  const invoices = (invoiceData ?? []) as InvoiceRow[];
  const agreement = agreementData as Agreement | null;

  let agreementPdfUrl: string | null = null;
  if (agreement?.content_type === "pdf" && agreement.file_path) {
    const { data: signed } = await supabase.storage
      .from("agreements")
      .createSignedUrl(agreement.file_path, 60 * 60);
    agreementPdfUrl = signed?.signedUrl ?? null;
  }

  let milestones: Milestone[] = [];
  let filesWithUrls: ProjectFileWithUrl[] = [];
  if (project) {
    const [{ data: milestoneData }, { data: fileData }] = await Promise.all([
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("project_files")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
    ]);
    milestones = (milestoneData ?? []) as Milestone[];

    const files = (fileData ?? []) as ProjectFile[];
    const fileSignedUrlByPath = new Map<string, string>();
    if (files.length > 0) {
      const { data: signed } = await supabase.storage
        .from("project-files")
        .createSignedUrls(
          files.map((file) => file.file_path),
          60 * 60
        );
      for (const item of signed ?? []) {
        if (item.signedUrl && item.path) {
          fileSignedUrlByPath.set(item.path, item.signedUrl);
        }
      }
    }
    filesWithUrls = files.map((file) => ({
      ...file,
      signedUrl: fileSignedUrlByPath.get(file.file_path) ?? null,
    }));
  }

  const signedUrlByPath = new Map<string, string>();
  if (invoices.length > 0) {
    const { data: signed } = await supabase.storage
      .from("client-invoices")
      .createSignedUrls(
        invoices.map((invoice) => invoice.file_path),
        60 * 60
      );
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/clients">
            <ArrowLeft />
            Πίσω στους Πελάτες
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {client.full_name || client.email}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {[client.company_name, client.email].filter(Boolean).join(" · ")}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Project</CardTitle>
            <CardDescription>
              {project
                ? "Επεξεργαστείτε τα στοιχεία του project."
                : "Δεν υπάρχει project ακόμη — δημιουργήστε το."}
            </CardDescription>
          </div>
          {project && <ProjectStatusBadge status={project.status} />}
        </CardHeader>
        <CardContent>
          <ProjectForm clientId={client.id} project={project ?? undefined} />
        </CardContent>
      </Card>

      {project && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">
                Milestones ({milestones.length})
              </CardTitle>
              <CardDescription>
                Τα βήματα του χρονοδιαγράμματος όπως θα τα βλέπει ο πελάτης.
              </CardDescription>
            </div>
            <NewMilestoneDialog projectId={project.id} />
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Δεν υπάρχουν ακόμη milestones.
              </p>
            ) : (
              <ul className="divide-y">
                {milestones.map((milestone, index) => (
                  <li
                    key={milestone.id}
                    className="flex items-start gap-3 py-3"
                  >
                    <MilestoneMoveButtons
                      milestoneId={milestone.id}
                      isFirst={index === 0}
                      isLast={index === milestones.length - 1}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{milestone.title}</span>
                        <MilestoneStatusBadge status={milestone.status} />
                      </div>
                      {milestone.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Προθεσμία: {formatDate(milestone.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <EditMilestoneDialog milestone={milestone} />
                      <ConfirmDeleteDialog
                        action={deleteMilestone.bind(null, milestone.id)}
                        description={`Σίγουρα θες να διαγράψεις το milestone «${milestone.title}»;`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Αρχεία ({filesWithUrls.length})
            </CardTitle>
            <CardDescription>
              Αρχεία που έχετε ανταλλάξει με τον πελάτη — φωτογραφίες,
              βίντεο και έγγραφα.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploader
              projectId={project.id}
              action={createAdminProjectFile}
              extraFields={{ client_id: client.id }}
            />
            <ProjectFilesList files={filesWithUrls} viewerRole="admin" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Συμφωνία</CardTitle>
          <CardDescription>
            Η συμφωνία που βλέπει ο πελάτης στη σελίδα «Συμφωνία» της πύλης
            του — κείμενο Markdown ή αρχείο PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgreementSection
            clientId={client.id}
            agreement={agreement}
            pdfUrl={agreementPdfUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Τιμολόγια Πελάτη ({invoices.length})
          </CardTitle>
          <CardDescription>
            Ό,τι έχει ήδη καταχωρηθεί στη σελίδα «Πληρωμές» για αυτόν τον
            πελάτη — αυτά βλέπει και ο ίδιος στην πύλη του.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν ακόμα τιμολόγια
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ποσό</TableHead>
                  <TableHead>Περιγραφή</TableHead>
                  <TableHead>Ημερομηνία</TableHead>
                  <TableHead>Αρχείο</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const url = signedUrlByPath.get(invoice.file_path);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {currencyFormatter.format(Number(invoice.amount))}
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                          >
                            Προβολή PDF
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDeleteDialog
                          action={deleteClientInvoice.bind(null, invoice.id)}
                          description={`Σίγουρα θες να διαγράψεις το τιμολόγιο «${invoice.description}»; Θα διαγραφεί και το αρχείο PDF.`}
                          successMessage="Το τιμολόγιο διαγράφηκε."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
