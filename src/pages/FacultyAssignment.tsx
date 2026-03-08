import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import type { Club } from "@/types/api";
import { mockClubs } from "@/lib/mock-data";

interface FacultyUser {
  _id: string;
  name: string;
  email: string;
  assignedClub: { _id: string; name: string } | null;
}

const mockFacultyUsers: FacultyUser[] = [
  { _id: "f1", name: "Dr. Sarah Wilson", email: "sarah@college.edu", assignedClub: { _id: "c1", name: "Robotics Club" } },
  { _id: "f2", name: "Prof. James Lee", email: "james@college.edu", assignedClub: null },
  { _id: "f3", name: "Dr. Emily Chen", email: "emily@college.edu", assignedClub: { _id: "c4", name: "Music Club" } },
];

const FacultyAssignment = () => {
  const { isDemo } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: faculty, isLoading: facultyLoading } = useQuery<FacultyUser[]>({
    queryKey: ["adminFaculty"],
    queryFn: isDemo
      ? () => Promise.resolve(mockFacultyUsers)
      : async () => (await api.get("/admin/faculty")).data,
  });

  const { data: clubs, isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: isDemo
      ? () => Promise.resolve(mockClubs)
      : async () => (await api.get("/clubs")).data,
  });

  const assignMutation = useMutation({
    mutationFn: ({ facultyId, clubId }: { facultyId: string; clubId: string | null }) =>
      isDemo
        ? Promise.resolve({})
        : api.put(`/admin/faculty/${facultyId}/assign`, { clubId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminFaculty"] });
      toast({ title: "Club assignment updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
  });

  const isLoading = facultyLoading || clubsLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-primary">
          <UserCog className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty Assignment</h1>
          <p className="text-sm text-muted-foreground">Assign faculty members to clubs they advise</p>
        </div>
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
                No faculty members found. Faculty users will appear here after they sign up.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FacultyAssignment;
