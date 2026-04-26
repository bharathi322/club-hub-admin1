import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useClubs } from "@/hooks/use-dashboard-api";
import { useCreateClub, useUpdateClub, useDeleteClub } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import ClubFormDialog from "./ClubFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Club } from "@/types/api";

const statusDot: Record<string, string> = {
  healthy: "bg-status-healthy",
  critical: "bg-status-critical",
  warning: "bg-status-warning",
};

const ClubStatus = () => {
  const { data: clubs, isLoading } = useClubs();
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();
  const deleteClub = useDeleteClub();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (data: Partial<Club> & { id?: string }) => {
    const mutation = data.id ? updateClub : createClub;

    mutation.mutate(data as any, {
      onSuccess: () => {
        setFormOpen(false);
        setEditingClub(null);
        toast({ title: data.id ? "Club updated" : "Club created" });
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed",
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;

    deleteClub.mutate(deletingId, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeletingId(null);
        toast({ title: "Club deleted" });
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Club Status Overview
          </CardTitle>

          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs"
            onClick={() => {
              setEditingClub(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : clubs?.length ? (
            clubs.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 group"
              >
                <div className="flex items-center gap-3">
                  {/* ✅ FIXED */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      statusDot[c.healthStatus] || "bg-muted-foreground"
                    }`}
                  />

                  <span className="text-sm font-medium text-card-foreground">
                    {c.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* ✅ FIXED */}
                  <Badge
                    variant={c.healthStatus as any}
                    className="capitalize"
                  >
                    {c.healthStatus}
                  </Badge>

                  <div className="hidden group-hover:flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingClub(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => {
                        setDeletingId(c._id);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No clubs found
            </p>
          )}
        </CardContent>
      </Card>

      <ClubFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        club={editingClub}
        onSubmit={handleSubmit}
        isLoading={createClub.isPending || updateClub.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Club"
        description="Are you sure you want to delete this club?"
        onConfirm={handleDelete}
        isLoading={deleteClub.isPending}
      />
    </>
  );
};

export default ClubStatus;