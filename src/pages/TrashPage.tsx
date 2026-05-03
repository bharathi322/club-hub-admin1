import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";

const TrashPage = () => {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const res = await api.get("/events/admin/trash");
      return res.data;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ eventId, fileId }: any) =>
      api.put(`/events/${eventId}/file/${fileId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ eventId, fileId }: any) =>
      api.delete(`/events/${eventId}/file/${fileId}/permanent`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading deleted files...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted files are stored here. You can restore or delete permanently.
        </p>
      </div>

      {/* EMPTY STATE */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trash2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No deleted files</p>
          <p className="text-sm text-muted-foreground">
            Files you delete will appear here
          </p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {data.map((item: any) => (
          <Card key={item.file._id} className="shadow-sm border">
            <CardContent className="flex items-center justify-between p-4">
              {/* LEFT */}
              <div className="flex flex-col">
                <p className="font-medium text-sm">
                  {item.file.originalName || item.file.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.eventName}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() =>
                    restoreMutation.mutate({
                      eventId: item.eventId,
                      fileId: item.file._id,
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => {
                    if (!confirm("Delete permanently?")) return;
                    deleteMutation.mutate({
                      eventId: item.eventId,
                      fileId: item.file._id,
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrashPage;