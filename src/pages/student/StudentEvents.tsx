import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useStudentEvents } from "@/hooks/use-dashboard-api";
// ✅ FIX 1: correct names — was useRegisterForEvent and useCancelRegistration (not imported)
import { useRegisterEvent, useCancelRegistration } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  approved: "bg-status-healthy",
  pending:  "bg-status-warning",
  warning:  "bg-status-critical",
};

const StudentEvents = () => {
  const { data: events, isLoading } = useStudentEvents();
  // ✅ FIX 2: correct hook names
  const registerMutation = useRegisterEvent();
  const cancelMutation   = useCancelRegistration();
  const { toast } = useToast();

  const handleRegister = (eventId: string) => {
    registerMutation.mutate(eventId, {
      onSuccess: () => toast({ title: "Registered successfully!" }),
      onError: (err: any) => toast({
        title: "Error",
        description: err.response?.data?.message || "Failed",
        variant: "destructive",
      }),
    });
  };

  const handleCancel = (eventId: string) => {
    cancelMutation.mutate(eventId, {
      onSuccess: () => toast({ title: "Registration cancelled" }),
      onError: (err: any) => toast({
        title: "Error",
        description: err.response?.data?.message || "Failed",
        variant: "destructive",
      }),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upcoming Events</h1>
        <p className="text-sm text-muted-foreground">Browse and register for club events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))
        ) : events?.length ? (
          events.map((event, i) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    {/* ✅ FIX 3: event.club is now ObjectId — show clubName instead */}
                    <Badge variant="secondary" className="text-xs">
                      {event.clubName || "Club"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${statusColors[event.status]}`} />
                    <span className="capitalize text-muted-foreground">{event.status}</span>
                    {event.rating > 0 && (
                      <span className="ml-auto text-xs font-medium">⭐ {event.rating}</span>
                    )}
                  </div>
                  <div className="pt-2">
                    {event.registrationStatus === "registered" ? (
                      <div className="flex gap-2">
                        <Badge className="bg-status-healthy/10 text-[hsl(var(--status-healthy))] border-0 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Registered
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto text-destructive hover:text-destructive text-xs"
                          onClick={() => handleCancel(event._id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full bg-gradient-primary border-0 hover:opacity-90"
                        onClick={() => handleRegister(event._id)}
                        disabled={registerMutation.isPending}
                      >
                        Register Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No upcoming events found.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentEvents;