export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import {
  getAllIndividuals,
  getAllRoles,
  getAllUnits,
  getAllPostings,
} from "@/lib/queries";
import { createPosting, deletePosting, toggleRoleVacancy } from "@/app/actions";

export default async function AdminPage() {
  const [individuals, roles, units, postings] = await Promise.all([
    getAllIndividuals(),
    getAllRoles(),
    getAllUnits(),
    getAllPostings(),
  ]);

  const unitById = new Map(units.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Add postings (past/current/planned/candidate), mark vacancies, remove
          rows.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a posting</CardTitle>
          <CardDescription>
            Pair an individual with a role. Status determines whether it&apos;s
            a past/current record or a future plan/candidate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPosting} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="individualId">Individual</Label>
              <Select name="individualId" required>
                <SelectTrigger id="individualId">
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {individuals.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name} {i.rank ? `(${i.rank})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleId">Role</Label>
              <Select name="roleId" required>
                <SelectTrigger id="roleId">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => {
                    const unit = unitById.get(r.unitId);
                    return (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.title} — {unit?.name} ({r.level})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" required defaultValue="Candidate">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Past">Past</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Candidate">Candidate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1" />

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="Optional context" />
            </div>

            <div className="md:col-span-2">
              <Button type="submit">Add posting</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All postings</CardTitle>
          <CardDescription>{postings.length} rows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Individual</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{p.individual.name}</TableCell>
                    <TableCell>
                      {p.role.title}{" "}
                      <span className="text-muted-foreground">
                        ({p.role.unit.name})
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.startDate ?? "—"} → {p.endDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                      {p.notes ?? ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deletePosting} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacancy flags</CardTitle>
          <CardDescription>
            Toggle a role&apos;s vacancy flag. Use this when a current incumbent
            is leaving and the slot needs a candidate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Vacant?</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => {
                  const unit = unitById.get(r.unitId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {unit?.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.level}
                      </TableCell>
                      <TableCell>{r.isVacant ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <form action={toggleRoleVacancy} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input
                            type="hidden"
                            name="isVacant"
                            value={String(r.isVacant)}
                          />
                          <Button type="submit" variant="ghost" size="sm">
                            {r.isVacant ? "Mark filled" : "Mark vacant"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
