import { useEffect, useState } from "react";
import api from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TrashPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await api.get("/events/admin/trash");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (eventId: string, fileId: string) => {
    try {
      await api.put(`/events/${eventId}/file/${fileId}/restore`);
      fetchTrash();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (eventId: string, fileId: string) => {
    try {
      await api.delete(`/events/${eventId}/file/${fileId}/permanent`);
      fetchTrash();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Trash</h1>

      {data.length === 0 && (
        <p className="text-muted-foreground">No deleted files</p>
      )}

      {data.map((event: any) => (
        <Card key={event._id}>
          <CardContent className="p-4 space-y-3">

            <div>
              <h2 className="font-semibold">{event.name}</h2>
              <p className="text-sm text-muted-foreground">
                {event.clubId?.name} • {event.date}
              </p>
            </div>

            {event.attachments.map((file: any) => (
              <div
                key={file._id}
                className="flex justify-between items-center border rounded px-3 py-2"
              >
                <span className="text-sm">{file.originalName}</span>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRestore(event._id, file._id)
                    }
                  >
                    Restore
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handlePermanentDelete(event._id, file._id)
                    }
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))}

          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrashPage;