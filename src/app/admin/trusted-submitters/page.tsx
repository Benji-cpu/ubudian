import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { TrustedSubmitterToggle } from "@/components/admin/trusted-submitter-toggle";

interface TrustedSubmitter {
  email: string;
  approved_count: number;
  auto_approve: boolean;
  created_at: string;
}

export default async function TrustedSubmittersPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("trusted_submitters")
    .select("*")
    .order("approved_count", { ascending: false });

  const submitters = (data ?? []) as TrustedSubmitter[];
  const autoApproveCount = submitters.filter((s) => s.auto_approve).length;
  const totalApprovals = submitters.reduce((sum, s) => sum + s.approved_count, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold">Trusted Submitters</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submitters who reach 5 approved events are automatically promoted to trusted status.
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Submitters</p>
            <CardTitle className="mt-1 text-2xl">{submitters.length}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Auto-Approve Enabled</p>
            <CardTitle className="mt-1 text-2xl">{autoApproveCount}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Approvals</p>
            <CardTitle className="mt-1 text-2xl">{totalApprovals}</CardTitle>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="mt-8">
        {submitters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/40" />
              <CardTitle className="mt-4 text-lg">No trusted submitters yet</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Approve event submissions to start building trust.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Approved Events</TableHead>
                <TableHead>Auto-Approve</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submitters.map((submitter) => (
                <TableRow key={submitter.email}>
                  <TableCell className="font-medium">{submitter.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{submitter.approved_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <TrustedSubmitterToggle
                      email={submitter.email}
                      initialValue={submitter.auto_approve}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(submitter.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
