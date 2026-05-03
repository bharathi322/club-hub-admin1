import { useEffect, useState } from "react";
import api from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MediaDocuments = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await api.get("/events/admin/media");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (fileId: string, eventId: string) => {
    try {
      await api.delete(`/events/${eventId}/file/${fileId}`);
      fetchMedia(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (name: string) => {
    if (!name) return "📄";
    const n = name.toLowerCase();

    if (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg")) return "🖼️";
    if (n.endsWith(".pdf")) return "📕";
    if (n.endsWith(".doc") || n.endsWith(".docx")) return "📘";

    return "📄";
  };

  const isPreviewable = (name: string) => {
    const n = name.toLowerCase();
    return n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".pdf");
  };

  const filteredData = data
    .map((event: any) => {
      const files = event.attachments?.filter((f: any) =>
        f.originalName.toLowerCase().includes(search.toLowerCase())
      );
      return { ...event, attachments: files };
    })
    .filter((e: any) => e.attachments.length > 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Media & Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage all uploaded files
          </p>
        </div>

        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
      </div>

      {/* EMPTY */}
      {filteredData.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          No files found
        </div>
      )}

      {/* EVENTS */}
      {filteredData.map((event: any) => (
        <Card key={event._id}>
          <CardContent className="p-5 space-y-4">

            {/* EVENT HEADER */}
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold">{event.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {event.clubId?.name} • {event.date}
                </p>
              </div>

              <span className="text-xs bg-muted px-2 py-1 rounded">
                {event.attachments.length} files
              </span>
            </div>

            {/* FILES */}
            <div className="space-y-2">
              {event.attachments.map((file: any) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between border rounded px-4 py-2"
                >
                  <div className="flex items-center gap-3 w-[60%]">
                    <span>{getIcon(file.originalName)}</span>
                    <span className="truncate text-sm">
                      {file.originalName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">

                    {/* PREVIEW */}
                    {isPreviewable(file.originalName) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPreview(`http://localhost:5000${file.url}`)
                        }
                      >
                        Preview
                      </Button>
                    )}

                    {/* OPEN */}
                    <a
                      href={`http://localhost:5000${file.url}`}
                      target="_blank"
                      className="text-blue-500"
                    >
                      Open
                    </a>

                    {/* DELETE */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDelete(file._id, event._id)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      ))}

      {/* PREVIEW MODAL */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl">
          {preview?.endsWith(".pdf") ? (
            <iframe src={preview} className="w-full h-[500px]" />
          ) : (
            <img src={preview} className="w-full rounded" />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MediaDocuments;