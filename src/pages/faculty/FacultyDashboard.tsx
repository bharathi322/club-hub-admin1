import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, ClipboardList, MessageSquare } from "lucide-react";
import { useFacultyClub, useFacultyStats } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";
import FacultyBudget from "@/components/dashboard/FacultyBudget";
import EventsTable from "@/components/dashboard/EventsTable";

const FacultyDashboard = () => {
  const { data: club, isLoading: clubLoading } = useFacultyClub();
  const { data: stats, isLoading: statsLoading } = useFacultyStats();

  const isLoading = clubLoading || statsLoading;

  // ✅ HANDLE NO CLUB ASSIGNED
  if (!clubLoading && !club) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            No Club Assigned
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Faculty Dashboard</h1>

      {/* ✅ STATS SECTION */}
      <div className="grid grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-lg font-bold">{stats?.totalEvents ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Pending Events</p>
                <p className="text-lg font-bold">{stats?.pendingEvents ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-lg font-bold">{stats?.totalRegistrations ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Feedback</p>
                <p className="text-lg font-bold">{stats?.feedbackCount ?? 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ✅ CLUB DETAILS */}
      {club && (
        <Card>
          <CardHeader>
            <CardTitle>{club.name}</CardTitle>
          </CardHeader>
          <CardContent>
            Members: {club.membersCount ?? 0} <br />
            Rating: {club.rating ?? 0}
          </CardContent>
        </Card>
      )}

      {/* ✅ BUDGET */}
      {club && (
        <FacultyBudget
          allocated={club.budgetAllocated ?? 0}
          used={club.budgetUsed ?? 0}
        />
      )}

      {/* ✅ EVENTS TABLE */}
      <EventsTable facultyView />

    </div>
  );
};

export default FacultyDashboard;