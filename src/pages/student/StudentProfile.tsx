import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Clock, Star, MessageSquare, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRegistrations } from "@/hooks/use-dashboard-api";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { mockMyRegistrations } from "@/lib/mock-data";

interface StudentFeedback {
  _id: string;
  targetType: "club" | "event";
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const mockFeedbackHistory: StudentFeedback[] = [
  { _id: "sf1", targetType: "club", targetId: "c1", targetName: "Robotics Club", rating: 5, comment: "Amazing club with great activities!", createdAt: "2026-03-06T10:00:00Z" },
  { _id: "sf2", targetType: "event", targetId: "e1", targetName: "Annual Robo Wars", rating: 4, comment: "Well organized event", createdAt: "2026-03-05T14:00:00Z" },
  { _id: "sf3", targetType: "club", targetId: "c4", targetName: "Music Club", rating: 5, comment: "Love the open mic nights", createdAt: "2026-03-03T09:00:00Z" },
];

const renderStars = (rating: number) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`text-sm ${s <= rating ? "text-[hsl(var(--chart-4))]" : "text-muted-foreground/30"}`}>★</span>
    ))}
  </span>
);

const StudentProfile = () => {
  const { user, isDemo } = useAuth();
  const { data: registrations, isLoading: regsLoading } = useMyRegistrations();

  const { data: feedbackHistory, isLoading: fbLoading } = useQuery<StudentFeedback[]>({
    queryKey: ["myFeedback"],
    queryFn: isDemo
      ? () => Promise.resolve(mockFeedbackHistory)
      : async () => (await api.get("/student/my-feedback")).data,
  });

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex gap-3 pt-1">
                  <Badge variant="secondary" className="gap-1">
                    <ClipboardList className="h-3 w-3" />
                    {registrations?.length ?? 0} Registrations
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {feedbackHistory?.length ?? 0} Reviews
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="registrations">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="registrations" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Registration History
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Feedback Given
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)
            ) : registrations?.length ? (
              registrations.map((reg, i) => (
                <motion.div
                  key={reg._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                      <CardTitle className="text-sm font-semibold">{reg.event.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs ${
                          reg.status === "attended"
                            ? "bg-status-healthy/10 text-[hsl(var(--status-healthy))]"
                            : reg.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : ""
                        }`}
                      >
                        {reg.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{reg.event.club}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {reg.event.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {reg.event.time}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Registered {format(new Date(reg.createdAt), "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No registrations yet. Browse events to register!
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-3">
          {fbLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : feedbackHistory?.length ? (
            feedbackHistory.map((fb, i) => (
              <motion.div
                key={fb._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{fb.targetType}</Badge>
                          <span className="text-sm font-medium text-card-foreground truncate">{fb.targetName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{fb.comment}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {renderStars(fb.rating)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(fb.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No feedback given yet. Visit clubs to share your experience!
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
