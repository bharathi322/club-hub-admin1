import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CalendarDays, Clock } from "lucide-react";

import { useFacultyEvents } from "@/hooks/use-dashboard-api";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/use-mutations";

import { Skeleton } from "@/components/ui/skeleton";
import EventFormDialog from "@/components/dashboard/EventFormDialog";
import DeleteConfirmDialog from "@/components/dashboard/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/types/api";
import { motion } from "framer-motion";

const statusDot: Record<string, string> = {
  approved: "bg-[hsl(var(--status-healthy))]",
  pending: "bg-[hsl(var(--status-warning))]",
  rejected: "bg-[hsl(var(--status-critical))]",
};

const FacultyEvents = () => {
  const { data: events = [], isLoading } = useFacultyEvents();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // SOCKET REAL-TIME
  useEffect(() => {
    socket.on("eventCreated", (newEvent) => {
      queryClient.setQueryData(["faculty-events"], (old: any) => {
        if (!old) return [newEvent];
        return [newEvent, ...old];
      });
    });

    socket.on("eventUpdated", (updatedEvent) => {
      queryClient.setQueryData(["faculty-events"], (old: any) => {
        if (!old) return [];
        return old.map((e: any) =>
          e._id === updatedEvent._id ? updatedEvent : e
        );
      });
    });

    socket.on("eventDeleted", (id) => {
      queryClient.setQueryData(["faculty-events"], (old: any) => {
        if (!old) return [];
        return old.filter((e: any) => e._id !== id);
      });
    });

    return () => {
      socket.off("eventCreated");
      socket.off("eventUpdated");
      socket.off("eventDeleted");
    };
  }, [queryClient]);

  const handleSubmit = (data: Partial<Event> & { id?: string }) => {
    const mutation = data.id ? updateEvent : createEvent;

    mutation.mutate(data as any, {
      onSuccess: () => {
        setFormOpen(false);
        setEditingEvent(null);
        toast({
          title: data.id ? "Event updated" : "Event created",
        });
      },
      onError: (err: any) =>
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed",
          variant: "destructive",
        }),
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
      onError: (err: any) =>
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed",
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Club Events</h1>
          <p className="text-sm text-muted-foreground">
            Manage events for your club
          </p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            setEditingEvent(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))
        ) : events.length ? (
          events.map((event, i) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2 flex justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        statusDot[event.status]
                      }`}
                    />
                    <CardTitle className="text-base">
                      {event.name}
                    </CardTitle>
                  </div>

                  <Badge variant={event.status as any}>
                    {event.status}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {event.date}
                  </div>

                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {event.time}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(event);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeletingId(event._id);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="col-span-full text-center py-12">
            No events yet. Create one.
          </p>
        )}
      </div>

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
        description="Are you sure?"
        onConfirm={handleDelete}
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
};

export default FacultyEvents;