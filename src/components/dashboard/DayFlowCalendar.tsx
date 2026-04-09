import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarEvents } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";

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
          <h4 className="text-sm font-semibold text-card-foreground">
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
                      className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-1 text-muted-foreground min-w-[80px]">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {event?.time || "--"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {event?.title || "Untitled Event"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event?.club || "Unknown Club"}
                        </p>
                      </div>

                      <Badge
                        variant={status}
                        className="text-[10px] capitalize"
                      >
                        {event?.status || "unknown"}
                      </Badge>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground py-4 text-center"
              >
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