import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import api from "@/api/api";
import { useEvents, useClubs } from "@/hooks/use-dashboard-api";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/use-mutations";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import EventFormDialog from "@/components/dashboard/EventFormDialog";
import DeleteConfirmDialog from "@/components/dashboard/DeleteConfirmDialog";

const EventsTable = ({ facultyView }: { facultyView?: boolean }) => {
  const { data: events = [], isLoading } = useEvents();
  const { data: clubs = [] } = useClubs();
  const { user } = useAuth();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5000;

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    const handleCreate = (newEvent: any) => {
      queryClient.setQueryData(["events"], (old: any) =>
        old ? [newEvent, ...old] : [newEvent]
      );
    };

    const handleUpdate = (updatedEvent: any) => {
      queryClient.setQueryData(["events"], (old: any) =>
        old?.map((e: any) =>
          e._id === updatedEvent._id ? updatedEvent : e
        )
      );
    };

    const handleDeleteSocket = (id: string) => {
      queryClient.setQueryData(["events"], (old: any) =>
        old?.filter((e: any) => e._id !== id)
      );
    };

    socket.on("event:created", handleCreate);
    socket.on("event:updated", handleUpdate);
    socket.on("event:deleted", (data: any) => {
      handleDeleteSocket(data.eventId);
    });

    return () => {
      socket.off("event:created", handleCreate);
      socket.off("event:updated", handleUpdate);
      socket.off("event:deleted");
    };
  }, [queryClient]);

  /* ================= SAFE EVENTS ================= */
  const safeEvents = Array.isArray(events)
    ? events
    : Array.isArray(events?.events)
    ? events.events
    : [];

  /* ================= SEARCH ================= */
  const filteredEvents = useMemo(() => {
    return safeEvents.filter(
      (e: any) =>
        e?.name &&
        e.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeEvents, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const paginatedEvents = filteredEvents;

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = (data: any) => {
    const mutation = data.id ? updateEvent : createEvent;

    mutation.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
        setEditingEvent(null);
        toast({ title: "Saved successfully" });
      },
    });
  };

  /* ================= DELETE ================= */
  const handleDelete = () => {
    if (!deletingId) return;

    deleteEvent.mutate(deletingId, {
      onSuccess: () => {
  queryClient.setQueryData(["events"], (old: any) =>
    old?.filter((e: any) => e._id !== deletingId)
  );

  // ✅ ADD THESE 3 LINES
  queryClient.invalidateQueries();

  setDeleteOpen(false);
  setDeletingId(null);
  toast({ title: "Deleted successfully" });
},
      onError: (err) => {
        console.log("Delete error:", err);
      },
    });
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async (e: any, eventId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (let file of files) {
      formData.append("files", file);
    }

    try {
      await api.post(`/events/${eventId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Files uploaded successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed" });
    }
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!facultyView && (
          <Button onClick={() => setFormOpen(true)}>
            Add Event
          </Button>
        )}
      </div>

      {/* TABLE */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : paginatedEvents.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Club</th>
                  <th>Faculty</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedEvents.map((event: any) => (
                  <tr key={event._id}>
                    <td>{event.name}</td>

                    <td>
  {typeof event.clubId === "object"
    ? event.clubId?.name
    : clubs.find(
        (c: any) => String(c._id) === String(event.clubId)
      )?.name || "Unknown Club"}
</td>

<td>
  {event.facultyName ||
    (typeof event.facultyId === "object"
      ? event.facultyId?.name
      : "Unknown Faculty")}
</td>

<td>{event.date?.split("T")[0]}</td>
                    <td>{event.status}</td>

                    <td className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEvent(event);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>

                      {facultyView && (
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            handleUpload(e, event._id)
                          }
                        />
                      )}

                      {(user?.role === "admin" ||
                        (user?.role === "faculty" &&
                          user?.assignedClubs?.includes(
String(event.clubId?._id || event.clubId)
                          ))) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteEvent.isPending}
                          onClick={() => {
                            setDeletingId(String(event._id));
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-6">No events found</p>
          )}
        </CardContent>
      </Card>

      {/* DIALOGS */}
      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Event"
        description={`Are you sure you want to delete "${
          safeEvents.find((e: any) => e._id === deletingId)?.name ||
          "this event"
        }"?`}
        onConfirm={handleDelete}
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
};

export default EventsTable;