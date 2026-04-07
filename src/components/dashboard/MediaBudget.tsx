import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Image, FileText, IndianRupee } from "lucide-react";
import { useBudgetOverview } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";

const MediaBudget = () => {
  const { data: overview, isLoading } = useBudgetOverview();

  const totalAllocated = overview?.reduce((s, o) => s + o.budgetAllocated, 0) ?? 0;
  const totalUsed = overview?.reduce((s, o) => s + o.budgetUsed, 0) ?? 0;
  const totalPhotos = overview?.reduce((s, o) => s + o.eventCount, 0) ?? 0;
  const budgetPercent = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
  const remaining = totalAllocated - totalUsed;

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Media & Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image className="h-4 w-4" />
              <span className="text-sm">Total Events</span>
            </div>
            {isLoading ? <Skeleton className="h-5 w-10" /> : (
              <span className="text-sm font-bold text-card-foreground">{totalPhotos}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Active Clubs</span>
            </div>
            {isLoading ? <Skeleton className="h-5 w-10" /> : (
              <span className="text-sm font-bold text-card-foreground">{overview?.length ?? 0}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : (
            <>
              <Progress value={budgetPercent} className="h-2.5" />
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Budget Used</p>
                  <p className="font-bold text-card-foreground">₹{totalUsed.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-bold text-[hsl(var(--status-healthy))]">₹{remaining.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Per-club breakdown */}
              <div className="space-y-2 pt-2 border-t">
                {overview?.map((item) => (
                  <div key={item.club._id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-card-foreground">{item.faculty?.name || "Unassigned"}</span>
                      <span className="text-muted-foreground ml-1">({item.club.name})</span>
                    </div>
                    <span className="text-muted-foreground">
                      ₹{item.budgetUsed.toLocaleString("en-IN")} ({item.eventCount} events)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaBudget;
