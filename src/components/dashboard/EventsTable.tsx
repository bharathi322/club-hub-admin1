import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Pencil, Trash2, Search, CalendarIcon, X } from "lucide-react";
import { useEvents, useClubs } from "@/hooks/use-dashboard-api";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import EventFormDialog from "./EventFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/api";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  approved: "default",
  pending: "secondary",
  warning: "destructive",
};

const EventsTable = () => {
  const { data: events, isLoading } = useEvents();
  const { data: clubs } = useClubs();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.club.toLowerCase().includes(search.toLowerCase())) return false;
      if (clubFilter !== "all" && e.club !== clubFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (dateFrom && e.date < format(dateFrom, "yyyy-MM-dd")) return false;
      if (dateTo && e.date > format(dateTo, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [events, search, clubFilter, statusFilter, dateFrom, dateTo]);

  const uniqueClubs = useMemo(() => {
    if (clubs?.length) return clubs.map((c) => c.name);
    if (!events) return [];
    return [...new Set(events.map((e) => e.club))];
  }, [events, clubs]);

  const hasActiveFilters = search || clubFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setClubFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSubmit = (data: Partial<Event> & { id?: string }) => {
    const mutation = data.id ? updateEvent : createEvent;
    mutation.mutate(data as any, {
      onSuccess: () => {
        setFormOpen(false);
        setEditingEvent(null);
        toast({ title: data.id ? "Event updated" : "Event created" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
      },
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteEvent.mutate(deletingId, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeletingId(null);
        toast({ title: "Event deleted" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
      },
    });
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Events Overview</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs"
            onClick={() => { setEditingEvent(null); setFormOpen(true); }}
          >
            <Plus className="h-3 w-3" /> Add Event
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {uniqueClubs.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 text-sm gap-1.5 font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, "MMM d") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 text-sm gap-1.5 font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, "MMM d") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          {!isLoading && events && (
            <p className="text-xs text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEvents.length ? (
                filteredEvents.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.club}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{e.date}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status] || "secondary"} className="capitalize">{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{e.rating || "--"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingEvent(e); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { setDeletingId(e._id); setDeleteOpen(true); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    {hasActiveFilters ? "No events match your filters" : "No events found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteEvent.isPending}
      />
    </>
  );
};

export default EventsTable;
