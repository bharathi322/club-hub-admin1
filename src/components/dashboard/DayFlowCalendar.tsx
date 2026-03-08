import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type DayEvent = {
  time: string;
  title: string;
  club: string;
  status: "approved" | "pending" | "warning";
};

const eventsMap: Record<string, DayEvent[]> = {
  "2026-03-08": [
    { time: "09:00 AM", title: "Club Heads Meeting", club: "All Clubs", status: "approved" },
    { time: "11:00 AM", title: "Coding Workshop", club: "Coding Club", status: "approved" },
    { time: "02:00 PM", title: "Dance Rehearsal", club: "Dance Club", status: "pending" },
    { time: "04:30 PM", title: "Budget Review", club: "Admin", status: "approved" },
  ],
  "2026-03-09": [
    { time: "10:00 AM", title: "Robotics Demo Setup", club: "Robotics Club", status: "warning" },
    { time: "01:00 PM", title: "Cultural Fest Planning", club: "All Clubs", status: "pending" },
  ],
  "2026-03-10": [
    { time: "09:30 AM", title: "Hackathon Kickoff", club: "Coding Club", status: "approved" },
    { time: "03:00 PM", title: "Photo Shoot", club: "Dance Club", status: "approved" },
  ],
  "2026-03-12": [
    { time: "11:00 AM", title: "Sponsor Meeting", club: "Admin", status: "pending" },
  ],
  "2026-03-15": [
    { time: "10:00 AM", title: "Annual Day Rehearsal", club: "Dance Club", status: "approved" },
    { time: "02:00 PM", title: "Project Showcase", club: "Robotics Club", status: "approved" },
    { time: "05:00 PM", title: "Award Ceremony Prep", club: "All Clubs", status: "pending" },
  ],
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  warning: "destructive",
};

const DayFlowCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const dayEvents = eventsMap[dateKey] || [];

  const eventDates = Object.keys(eventsMap).map((d) => new Date(d));

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Day Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border pointer-events-auto"
          modifiers={{ hasEvent: eventDates }}
          modifiersClassNames={{
            hasEvent: "bg-primary/20 font-bold text-primary",
          }}
        />

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-card-foreground">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
          </h4>

          <AnimatePresence mode="wait">
            {dayEvents.length > 0 ? (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2 pt-1"
              >
                {dayEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-1 text-muted-foreground min-w-[80px]">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{event.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.club}</p>
                    </div>
                    <Badge variant={statusVariant[event.status]} className="text-[10px] capitalize">
                      {event.status}
                    </Badge>
                  </div>
                ))}
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
