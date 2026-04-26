import { useEffect, useState } from "react";
import api from "@/api/api";

const MediaDocuments = () => {
  const [data, setData] = useState([]);

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

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Media & Documents
      </h1>

      {data.map((event: any) => (
        <div
          key={event._id}
          className="mb-6 border p-4 rounded"
        >
          <h2 className="font-semibold">{event.name}</h2>

          <p>Club: {event.clubId?.name}</p>
          <p>Date: {event.date}</p>

          <div className="mt-2">
            {event.attachments?.map(
              (file: any, i: number) => (
                <div key={i}>
                  <a
                    href={`http://localhost:5000${file.url}`}
                    target="_blank"
                    className="text-blue-500 underline"
                  >
                    {file.filename}
                  </a>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaDocuments;