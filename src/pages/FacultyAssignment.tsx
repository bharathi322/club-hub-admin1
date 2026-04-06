import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserCog, GraduationCap, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Club } from "@/types/api";
import { useClubs } from "@/hooks/use-dashboard-api";

interface FacultyUser {
  _id: string;
  name: string;
  email: string;
  assignedClub: { _id: string; name: string } | null;
}

const FacultyAssignment = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newClubId, setNewClubId] = useState("none");

  const { data: faculty, isLoading: facultyLoading } = useQuery<FacultyUser[]>({
    queryKey: ["adminFaculty"],
    queryFn: async () => (await api.get("/admin/faculty")).data,
  });

  const { data: clubs, isLoading: clubsLoading } = useClubs();

  const assignMutation = useMutation({
    mutationFn: ({ facultyId, clubId }: { facultyId: string; clubId: string | null }) =>
      api.put(`/admin/faculty/${facultyId}/assign`, { clubId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminFaculty"] });
      toast({ title: "Club assignment updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; clubId?: string }) =>
      api.post("/admin/faculty", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminFaculty"] });
      toast({ title: "Faculty account created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
  });

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewClubId("none");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newName,
      email: newEmail,
      password: newPassword,
      clubId: newClubId === "none" ? undefined : newClubId,
    });
  };

  const isLoading = facultyLoading || clubsLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <UserCog className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Faculty Assignment</h1>
            <p className="text-sm text-muted-foreground">Assign faculty members to clubs they advise</p>
          </div>
        </div>
        <Button className="gap-2 bg-gradient-primary border-0 hover:opacity-90" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Faculty
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Faculty Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}
              </div>
            ) : faculty?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Club</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((f) => (
                    <TableRow key={f._id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">{f.email}</TableCell>
                      <TableCell>
                        <Select
                          value={f.assignedClub?._id || "none"}
                          onValueChange={(val) =>
                            assignMutation.mutate({
                              facultyId: f._id,
                              clubId: val === "none" ? null : val,
                            })
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select club" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Unassigned —</SelectItem>
                            {clubs?.map((club) => (
                              <SelectItem key={club._id} value={club._id}>
                                {club.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No faculty members found. Click "Add Faculty" to create one.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Faculty Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faculty-name">Full Name</Label>
              <Input id="faculty-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dr. John Smith" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-email">Email</Label>
              <Input id="faculty-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@college.edu" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-password">Password</Label>
              <Input id="faculty-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Assign to Club (optional)</Label>
              <Select value={newClubId} onValueChange={setNewClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {clubs?.map((club) => (
                    <SelectItem key={club._id} value={club._id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-primary border-0 hover:opacity-90" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyAssignment;
