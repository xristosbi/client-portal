import type { Metadata } from "next";
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
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { createClient } from "@/lib/supabase/server";
import { deleteTeamMember } from "./actions";
import { EditMemberDialog, NewMemberDialog } from "./new-member-dialog";

export const metadata: Metadata = {
  title: "Προσωπικό",
};

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AdminTeamPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("team_members")
    .select("*")
    .order("created_at", { ascending: false });

  const members = (data ?? []) as TeamMember[];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Προσωπικό</h1>
          <p className="mt-1 text-muted-foreground">
            Τα μέλη και οι συνεργάτες της ομάδας σας.
          </p>
        </div>
        <NewMemberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Μέλη Ομάδας ({members.length})
          </CardTitle>
          <CardDescription>
            Καταχωρήσεις για εσωτερική ενημέρωση — χωρίς πρόσβαση στην πύλη.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν ακόμη μέλη ομάδας.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ονοματεπώνυμο</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ρόλος / Θέση</TableHead>
                  <TableHead>Προστέθηκε</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.position || "—"}</TableCell>
                    <TableCell>
                      {dateFormatter.format(new Date(member.created_at))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EditMemberDialog member={member} />
                        <ConfirmDeleteDialog
                          action={deleteTeamMember.bind(null, member.id)}
                          description={`Σίγουρα θες να διαγράψεις το μέλος «${member.full_name}»;`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
