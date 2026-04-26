import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import { useStudentEvents } from "@/hooks/use-dashboard-api";
import { useRegisterEvent } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  approved: "bg-status-healthy",
  pending: "bg-status-warning",
  warning: "bg-status-critical",
};

const StudentEvents = () => {
  const { data: events, isLoading } = useStudentEvents();
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
        <p className="text-sm text-muted-foreground">
          Browse and register for club events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))
        ) : events?.length ? (
          events.map((event, i) => {
            const eventDateTime = new Date(`${event.date} ${event.time}`);
            const now = new Date();

            const isRegistered = event.registrationStatus === "registered";
            const isCompleted = now > eventDateTime;

            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
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

                    {/* STATUS */}
                    <div className="flex gap-2 text-sm">
                      {isCompleted ? (
                        <span className="text-gray-500">Completed</span>
                      ) : (
                        <span className="capitalize">
                          {event.status}
                        </span>
                      )}
                    </div>

                    {/* ACTION SECTION */}
                    <div className="pt-2">

                      {/* COMPLETED */}
                      {isCompleted && (
                        <>
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
                        </>
                      )}

                      {/* REGISTERED */}
                      {!isCompleted && isRegistered && (
                        <div className="flex justify-between items-center">
                          <Badge className="bg-green-500 text-white">
                            Registered
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Cannot cancel
                          </span>
                        </div>
                      )}

                      {/* NOT REGISTERED */}
                      {!isCompleted && !isRegistered && (
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
    </div>
  );
};

export default StudentEvents;