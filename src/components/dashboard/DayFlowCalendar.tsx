import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarEvents } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/api";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  pending: "secondary",
  warning: "destructive",
};

const DayFlowCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const dateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : "";

  const { data, isLoading } = useCalendarEvents(dateKey);

  const dayEvents = data?.events || [];

  // ✅ approve / reject
  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/events/${id}/status`, { status });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Day Flow
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border pointer-events-auto"
        />

        <div className="space-y-1">
          <h4 className="text-sm font-semibold">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d, yyyy")
              : "Select a date"}
          </h4>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="space-y-2 pt-1">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : dayEvents.length > 0 ? (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2 pt-1"
              >
                {dayEvents.map((event: any, i: number) => {
                  const status =
                    statusVariant[event?.status] || "outline";

                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-2 rounded-lg bg-muted/50 border"
                    >
                      {/* EVENT INFO */}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1 min-w-[80px]">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {event?.time || "--"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {event?.title || "Untitled Event"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event?.club || "Unknown Club"}
                          </p>
                        </div>

                        <Badge variant={status} className="text-[10px]">
                          {event?.status || "unknown"}
                        </Badge>
                      </div>

                      {/* APPROVE / REJECT BUTTONS */}
                      {event?.status === "pending" && (
                        <div className="flex gap-2 ml-[90px]">
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() =>
                              updateStatus(event._id, "approved")
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() =>
                              updateStatus(event._id, "rejected")
                            }
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.p className="text-sm text-center py-4">
                No events scheduled
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default DayFlowCalendar;