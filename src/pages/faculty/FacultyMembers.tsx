import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFacultyRegistrations } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";

const FacultyMembers = () => {
  const { data: registrations = [], isLoading } = useFacultyRegistrations();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Registered Students
        </h1>
        <p className="text-sm text-muted-foreground">
          Students registered for your club's events
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded" />
                ))}
              </div>
            ) : registrations.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {registrations.map((reg: any) => (
                    <TableRow key={reg._id}>
                      <TableCell className="font-medium">
                        {reg?.student?.name ?? "—"}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {reg?.student?.email ?? "—"}
                      </TableCell>

                      <TableCell>
                        {reg?.event?.name ?? "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="capitalize"
                        >
                          {reg?.status ?? "unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No registrations yet.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FacultyMembers;