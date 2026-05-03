import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import { useStudentEvents } from "@/hooks/use-dashboard-api";
import { useRegisterEvent } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { useEffect } from "react";

const statusColors: Record<string, string> = {
approved: "bg-status-healthy",
pending: "bg-status-warning",
warning: "bg-status-critical",
};

const StudentEvents = () => {
const queryClient = useQueryClient();

useEffect(() => {
socket.on("event:created", () => {
queryClient.invalidateQueries({ queryKey: ["student-events"] });
});

socket.on("event:updated", () => {
  queryClient.invalidateQueries({ queryKey: ["student-events"] });
});

return () => {
  socket.off("event:created");
  socket.off("event:updated");
};


}, [queryClient]);

const { data: events, isLoading } = useStudentEvents();

useEffect(() => {
console.log("STUDENT EVENTS:", events);
}, [events]);

const registerMutation = useRegisterEvent();
const { toast } = useToast();

const handleRegister = (eventId: string) => {
registerMutation.mutate(eventId, {
onSuccess: () => toast({ title: "Registered successfully!" }),
onError: (err: any) =>
toast({
title: "Error",
description: err.response?.data?.message || "Failed",
variant: "destructive",
}),
});
};

return ( <div className="p-6 space-y-6">
  {/* HEADER */}
  <div>
    <h1 className="text-2xl font-bold">Upcoming Events</h1>
    <p className="text-sm text-muted-foreground">
      Browse and register for club events
    </p>
  </div>

  {/* UPCOMING EVENTS */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {isLoading ? (
      Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-lg" />
      ))
    ) : events?.length ? (
  events
  .filter((event) => {
    if (!event.date) return true;

    const todayStr = new Date().toISOString().split("T")[0];

    return event.date >= todayStr;
  })
        .map((event) => {
          const isRegistered =
            event.registrationStatus === "registered";

          return (
            <motion.div key={event._id}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>{event.name}</CardTitle>
                    <Badge>{event.clubName || "Club"}</Badge>
                  </div>
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

                  <div className="pt-2">
                    {isRegistered ? (
                      <Badge className="bg-green-500 text-white">
                        Registered
                      </Badge>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleRegister(event._id)}
                      >
                        Register Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })
    ) : (
      <p className="col-span-full text-center">
        No upcoming events
      </p>
    )}
  </div>

  {/* COMPLETED EVENTS */}
  <div>
    <h2 className="text-xl font-semibold mt-8">Completed Events</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {events
        ?.filter((event) => {
          if (!event.date) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);

          return eventDate < today;
        })
        .map((event) => (
          <Card key={event._id}>
            <CardContent className="p-4 space-y-2">
              <p className="font-bold">{event.name}</p>
              <p className="text-sm text-muted-foreground">
                {event.date}
              </p>

              {event.registrationStatus === "attended" && (
                <Badge className="bg-green-500 text-white">
                  Attended
                </Badge>
              )}

              {event.registrationStatus === "absent" && (
                <Badge className="bg-red-500 text-white">
                  Missed
                </Badge>
              )}

              {event.registrationStatus === "registered" && (
                <Badge className="bg-gray-400 text-white">
                  Pending
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  </div>

</div>
);
};

export default StudentEvents;
