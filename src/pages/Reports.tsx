import { useState, useEffect } from "react";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Reports = () => {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState(null);

  // ✅ LOAD EVENTS
  useEffect(() => {
    api.get("/events")
      .then(res => setEvents(res.data))
      .catch(() => setEvents([]));
  }, []);

  // ✅ LOAD REPORT
  useEffect(() => {
  if (!selectedId) return;

  api.get(`/events/${selectedId}`)
    .then(res => {
      const data = res.data;

      // normalize to single event object
      const event =
        data?.data ??
        data?.event ??
        (Array.isArray(data) ? data[0] : data);

      console.log("NORMALIZED EVENT:", event);
      setReport(event || null);
    })
    .catch(err => {
      console.error(err);
      setReport(null);
    });
}, [selectedId]);

  const brochure = report?.attachments?.find(
  (f) => f.label === "brochure" && !f.isDeleted
);

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate dynamic event reports
        </p>
      </div>

      {/* SELECT EVENT */}
      <Card>
        <CardContent className="p-4">
          <select
            className="w-full border p-2 rounded"
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option>Select Event</option>

            {Array.isArray(events) &&
              events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
          </select>
        </CardContent>
      </Card>

      {/* REPORT */}
     {report?.name && (
  <Card className="shadow-card">
    <CardContent className="p-6 space-y-6 text-sm">

      {/* HEADER */}
      <div className="text-center border-b pb-4">
        <h2 className="text-lg font-bold">COLLEGE EVENT REPORT</h2>
        <p>{report.name}</p>
      </div>

      {/* BASIC DETAILS */}
      <div className="grid grid-cols-2 gap-4">
        <p><b>Event Type:</b> {report.type}</p>
        <p><b>Department:</b> {report.department}</p>
        <p><b>Date:</b> {report.date}</p>
        <p><b>Time:</b> {report.time}</p>
        <p><b>Venue:</b> {report.venue}</p>
      </div>

      {/* RESOURCE PERSON */}
      <div>
        <h3 className="font-semibold border-b pb-1 mb-2">Resource Person</h3>
        <p><b>Name:</b> {report.resourcePerson?.name}</p>
        <p><b>Organization:</b> {report.resourcePerson?.organization}</p>
      </div>

      {/* PARTICIPATION */}
      <div>
        <h3 className="font-semibold border-b pb-1 mb-2">Participation</h3>
        <div className="grid grid-cols-2 gap-2">
          <p><b>Faculty Internal:</b> {report.facultyParticipants?.internal}</p>
          <p><b>Faculty External:</b> {report.facultyParticipants?.external}</p>
          <p><b>Students Internal:</b> {report.studentParticipants?.internal}</p>
          <p><b>Students External:</b> {report.studentParticipants?.external}</p>
        </div>
      </div>

      {/* TOPICS */}
      <div>
        <h3 className="font-semibold border-b pb-1 mb-2">Topics Covered</h3>
        <p>{report.topicsCovered}</p>
      </div>

      {/* AGENDA */}
      <div>
        <h3 className="font-semibold border-b pb-1 mb-2">Agenda</h3>
        <p>{report.agenda}</p>
      </div>

      {/* SUMMARY */}
      <div>
        <h3 className="font-semibold border-b pb-1 mb-2">Summary</h3>
        <p>{report.summary}</p>
      </div>

      {/* COORDINATORS */}
      <div className="grid grid-cols-2 gap-4">
        <p><b>Faculty Coordinator:</b> {report.facultyCoordinator}</p>
        <p><b>Student Coordinator:</b> {report.studentCoordinator}</p>
      </div>

      {/* BROCHURE */}
      {brochure && (
        <div>
          <h3 className="font-semibold border-b pb-1 mb-2">Attachments</h3>
          <a
            href={`http://localhost:5000${brochure.url}`}
            target="_blank"
            className="text-blue-500 underline"
          >
            View Brochure
          </a>
        </div>
      )}

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={() => window.print()}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        Download PDF
      </button>

    </CardContent>
  </Card>
)}

    </div>
  );
};

export default Reports;