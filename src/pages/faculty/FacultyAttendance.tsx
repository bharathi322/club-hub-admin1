import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useFacultyEvents,
  useFacultyRegistrations,
} from "@/hooks/use-dashboard-api";
import {
  useMarkAttendance,
  useBulkMarkAttendance,
} from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, CheckCheck, Download } from "lucide-react";
          import api from "@/api/api";


const FacultyAttendance = () => {
  const { data: events = [], isLoading: eventsLoading } = useFacultyEvents();
  const { data: registrations = [], isLoading: regsLoading } =
    useFacultyRegistrations();

  const markAttendance = useMarkAttendance();
  const bulkMark = useBulkMarkAttendance();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ✅ SAFE FILTER
  const filtered =
    registrations?.filter(
      (r: any) =>
        selectedEvent === "all" || r?.event?._id === selectedEvent
    ) ?? [];

  const attendedCount = filtered.filter(
    (r: any) => r?.status === "attended"
  ).length;

  const unattendedFiltered = filtered.filter(
    (r: any) => r?.status !== "attended"
  );

  const allSelected =
    unattendedFiltered.length > 0 &&
    unattendedFiltered.every((r: any) => selectedIds.has(r._id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(unattendedFiltered.map((r: any) => r._id))
      );
    }
  };

  const handleToggle = (reg: any) => {
    const newStatus =
      reg.status === "attended" ? "registered" : "attended";

    markAttendance.mutate(
      { id: reg._id, status: newStatus },
      {
        onSuccess: () =>
          toast({ title: `Marked as ${newStatus}` }),
        onError: (err: any) =>
          toast({
            title: "Error",
            description:
              err.response?.data?.message || "Failed",
            variant: "destructive",
          }),
      }
    );
  };

  const handleBulkMark = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    bulkMark.mutate(
      { ids, status: "attended" },
      {
        onSuccess: (data: any) => {
          toast({
            title: `${
              data.count ?? ids.length
            } students marked as attended`,
          });
          setSelectedIds(new Set());
        },
        onError: (err: any) =>
          toast({
            title: "Error",
            description:
              err.response?.data?.message || "Failed",
            variant: "destructive",
          }),
      }
    );
  };

  const isLoading = eventsLoading || regsLoading;
  const isBusy = markAttendance.isPending || bulkMark.isPending;

  // ✅ SAFE EXPORT
  const handleExportCSV = () => {
    if (!filtered.length) return;

const headers = ["Student", "Reg No", "Email", "Event", "Status"];
    const rows = filtered.map((r: any) => [
  r?.student?.name ?? "—",
  r?.student?.regNo ?? "—",
  r?.student?.email ?? "—",
  r?.event?.name ?? "—",
  r?.status ?? "—",
]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v: string) => `"${v}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const eventName =
      events?.find((e: any) => e._id === selectedEvent)
        ?.name ?? selectedEvent;

    a.download = `attendance-report${
      selectedEvent !== "all" ? `-${eventName}` : ""
    }.csv`;

    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exported successfully" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance Tracking
          </h1>
          <p className="text-sm text-muted-foreground">
            Mark students as attended for your club's events
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <Button
              className="gap-2 bg-gradient-primary border-0 hover:opacity-90"
              onClick={handleBulkMark}
              disabled={isBusy}
            >
              <CheckCheck className="h-4 w-4" />
              Mark {selectedIds.size} as Attended
            </Button>
          )}


        <Button
  variant="outline"
  onClick={async () => {
    try {
      if (!selectedEvent || selectedEvent === "all") {
        toast({
          title: "Select event first",
          variant: "destructive",
        });
        return;
      }

      const res = await api.get(
        `/faculty/attendance/${selectedEvent}/pdf`,
        {
          responseType: "blob",
        }
      );

      const file = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(file);

      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${selectedEvent}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error(err);

      toast({
        title: "Download failed",
        description: err?.response?.data?.message || "Server error",
        variant: "destructive",
      });
    }
  }}
>
  Download Sheet
</Button>

          <Select
            value={selectedEvent}
            onValueChange={(v) => {
              setSelectedEvent(v);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>

              {events.map((e: any) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {filtered.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Registered
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {attendedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Attended
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              %
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filtered.length
                  ? Math.round(
                      (attendedCount / filtered.length) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                Attendance Rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded" />
                ))}
              </div>
            ) : filtered.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        disabled={
                          isBusy ||
                          unattendedFiltered.length === 0
                        }
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg No</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((reg: any) => {
                    const isAttended =
                      reg.status === "attended";

                    return (
                      <TableRow key={reg._id}>
                        <TableCell>
                          <Checkbox
                            checked={
                              isAttended ||
                              selectedIds.has(reg._id)
                            }
                            onCheckedChange={() =>
                              isAttended
                                ? handleToggle(reg)
                                : toggleSelect(reg._id)
                            }
                            disabled={isBusy}
                          />
                        </TableCell>

                        <TableCell>
  {reg?.student?.name ?? "—"}
</TableCell>

<TableCell>
  {reg?.student?.regNo ?? "—"}
</TableCell>

<TableCell>
  {reg?.student?.email ?? "—"}
</TableCell>

                        <TableCell>
                          {reg?.event?.name ?? "—"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              isAttended
                                ? "default"
                                : "secondary"
                            }
                          >
                            {reg.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No registrations found.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FacultyAttendance;