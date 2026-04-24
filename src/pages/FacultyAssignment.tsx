import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface FacultyUser {
  _id: string;
  name: string;
  email: string;
  assignedClubs: { _id: string; name: string }[];
}

interface Club {
  _id: string;
  name: string;
}

const FacultyAssignment = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newClubId, setNewClubId] = useState("none");

  const { data: faculty, isLoading: facultyLoading } = useQuery<FacultyUser[]>({
    queryKey: ["faculty"],
    queryFn: async () => (await api.get("/admin/faculty")).data,
  });

  const { data: clubs, isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: async () => (await api.get("/clubs")).data,
  });

  const assignMutation = useMutation({
    mutationFn: ({ facultyId, clubId }: any) =>
      api.put(`/admin/faculty/${facultyId}/assign`, { clubId }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty"] });
      qc.refetchQueries({ queryKey: ["faculty"] }); // important
      toast({ title: "Assigned successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/faculty/${id}`),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty"] });
      toast({ title: "Faculty deleted" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/assign-faculty", data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty"] });
      toast({ title: "Faculty created" });
      setDialogOpen(false);
      resetForm();
    },

    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.response?.data?.message,
        variant: "destructive",
      }),
  });

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewClubId("none");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) {
      toast({ title: "Error", description: "Name required", variant: "destructive" });
      return;
    }

    if (!newEmail.includes("@")) {
      toast({ title: "Error", description: "Invalid email", variant: "destructive" });
      return;
    }

    const exists = faculty?.some(
      (f) => f.email.toLowerCase() === newEmail.toLowerCase()
    );

    if (exists) {
      toast({ title: "Error", description: "Email already exists", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name: newName,
      email: newEmail,
      clubId: newClubId === "none" ? undefined : newClubId,
    });
  };

  const isLoading = facultyLoading || clubsLoading;

  return (
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Faculty Assignment</h1>

        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Members</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Club</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {faculty?.map((f) => (
                  <TableRow key={f._id}>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.email}</TableCell>

                    <TableCell>
                      <Select
                        disabled={assignMutation.isPending}
                        value={
                          f.assignedClubs && f.assignedClubs.length > 0
                            ? f.assignedClubs[0]._id
                            : "none"
                        }
                        onValueChange={(val) => {
                          console.log("Selected:", val);

                          assignMutation.mutate({
                            facultyId: f._id,
                            clubId: val === "none" ? undefined : val,
                          });
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>

                          {clubs?.map((club) => {
                            const isAssigned = faculty?.some(
                              (fac) =>
                                fac._id !== f._id &&
                                fac.assignedClubs?.some(
                                  (c) => c._id === club._id
                                )
                            );

                            return (
                              <SelectItem
                                key={club._id}
                                value={club._id}
                                disabled={isAssigned}
                              >
                                {club.name} {isAssigned ? "(Assigned)" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!confirm("Delete faculty?")) return;
                          deleteMutation.mutate(f._id);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Faculty</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

            <Select value={newClubId} onValueChange={setNewClubId}>
              <SelectTrigger>
                <SelectValue placeholder="Select club" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clubs?.map((club) => (
                  <SelectItem key={club._id} value={club._id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FacultyAssignment;