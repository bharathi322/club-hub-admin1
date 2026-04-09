import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Users } from "lucide-react";
import { useQuickStats } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";

const QuickStats = () => {
  const { data, isLoading } = useQuickStats();

  const stats = [
    {
      label: "Upcoming Events",
      value: data?.upcomingEvents ?? 0,
      icon: Calendar,
    },
    {
      label: "Reports Pending",
      value: data?.reportsPending ?? 0,
      icon: FileText,
    },
    {
      label: "Total Participants",
      value: data?.totalParticipants ?? 0,
      icon: Users,
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Quick Stats
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3 text-muted-foreground">
              <s.icon className="h-4 w-4" />
              <span className="text-sm">{s.label}</span>
            </div>

            {isLoading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="text-sm font-bold text-card-foreground">
                {s.value}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickStats;