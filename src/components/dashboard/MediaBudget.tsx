import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBudget } from "@/hooks/use-dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { FileText, IndianRupee } from "lucide-react";

const MediaBudget = () => {
  const { data, isLoading } = useBudget();
  const navigate = useNavigate();

  const budgetPercent =
    data && data.budgetTotal
      ? Math.round((data.budgetUsed / data.budgetTotal) * 100)
      : 0;

  const remaining =
    data &&
    typeof data.budgetTotal === "number" &&
    typeof data.budgetUsed === "number"
      ? data.budgetTotal - data.budgetUsed
      : 0;

  return (
    <div className="space-y-4">

      {/* MEDIA SECTION */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Media & Documents
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Files Uploaded */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Files Uploaded</span>
            </div>

            {isLoading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="text-lg font-semibold">
                {data?.totalFiles ?? "--"}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground">
            Access all uploaded media and documents in one place
          </p>

          {/* Button */}
          <Button
            className="w-full"
            onClick={() => navigate("/admin/media")}
          >
            View All Media & Documents
          </Button>

        </CardContent>
      </Card>

      {/* BUDGET SECTION */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Budget Overview
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : (
            <>
              {/* Progress */}
              <Progress value={budgetPercent} className="h-2.5" />

              {/* Values */}
              <div className="flex justify-between text-sm">

                <div>
                  <p className="text-muted-foreground">Budget Used</p>
                  <p className="font-bold text-card-foreground">
                    ₹
                    {typeof data?.budgetUsed === "number"
                      ? data.budgetUsed.toLocaleString("en-IN")
                      : "--"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-bold text-status-healthy">
                    ₹
                    {remaining
                      ? remaining.toLocaleString("en-IN")
                      : "--"}
                  </p>
                </div>

              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default MediaBudget;