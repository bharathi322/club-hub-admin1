import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useClubs } from "@/hooks/use-dashboard-api";
import { useAuth } from "@/contexts/AuthContext";

const EventFormDialog = ({
  open,
  onOpenChange,
  event,
  onSubmit,
  isLoading,
}: any) => {
  const { data: clubs } = useClubs();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budgetSpent, setBudgetSpent] = useState("");

  const [type, setType] = useState("");
  const [department, setDepartment] = useState("");
  const [venue, setVenue] = useState("");

  const [rpName, setRpName] = useState("");
  const [rpOrg, setRpOrg] = useState("");

  const [topics, setTopics] = useState("");

  const [facInt, setFacInt] = useState(0);
  const [facExt, setFacExt] = useState(0);
  const [stuInt, setStuInt] = useState(0);
  const [stuExt, setStuExt] = useState(0);

  const [facCoord, setFacCoord] = useState("");
  const [stuCoord, setStuCoord] = useState("");

  const [agenda, setAgenda] = useState("");
  const [summary, setSummary] = useState("");

  const [brochure, setBrochure] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [facultyId, setFacultyId] = useState("");

  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setClub(event.clubId || "");
      setDate(event.date ? event.date.split("T")[0] : "");
      setTime(event.time || "");
      setBudgetSpent(String(event.budgetSpent || 0));

      setType(event.type || "");
      setDepartment(event.department || "");
      setVenue(event.venue || "");

      setRpName(event.resourcePerson?.name || "");
      setRpOrg(event.resourcePerson?.organization || "");

      setTopics(event.topicsCovered || "");

      setFacInt(event.facultyParticipants?.internal || 0);
      setFacExt(event.facultyParticipants?.external || 0);

      setStuInt(event.studentParticipants?.internal || 0);
      setStuExt(event.studentParticipants?.external || 0);

      setFacCoord(event.facultyCoordinator || "");
      setStuCoord(event.studentCoordinator || "");

      setAgenda(event.agenda || "");
      setSummary(event.summary || "");
    } else {
      setName("");
      setClub("");
      setDate("");
      setTime("");
      setBudgetSpent("");
      setFiles([]);
    }
  }, [event, open]);

  useEffect(() => {
    if (user?.role === "faculty" && user?.assignedClubs?.length > 0) {
      setClub(user.assignedClubs[0]);
    }
  }, [user]);

  useEffect(() => {
    if (!club || !clubs) return;
    const selectedClub = clubs.find(
      (c: any) => String(c._id) === String(club)
    );
    if (selectedClub?.facultyIds?.length > 0) {
      setFacultyId(selectedClub.facultyIds[0]);
    }
  }, [club, clubs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("name", name);
    formData.append("type", type);
    formData.append("department", department);
    formData.append("venue", venue);

    formData.append("topicsCovered", topics);
    formData.append("facultyCoordinator", facCoord);
    formData.append("studentCoordinator", stuCoord);

    formData.append("agenda", agenda);
    formData.append("summary", summary);

    formData.append("resourcePerson[name]", rpName);
    formData.append("resourcePerson[organization]", rpOrg);

    formData.append("facultyParticipants[internal]", String(facInt));
    formData.append("facultyParticipants[external]", String(facExt));

    formData.append("studentParticipants[internal]", String(stuInt));
    formData.append("studentParticipants[external]", String(stuExt));

    formData.append("clubId", club);
    formData.append("date", date);
    formData.append("time", time);
    formData.append("budgetSpent", String(Number(budgetSpent) || 0));

    if (facultyId) formData.append("facultyId", facultyId);

    files.forEach((file) => {
      formData.append("attachments", file);
    });

    if (brochure) {
      formData.append("attachments", brochure);
      formData.append("brochureLabel", "brochure");
    }

    if (event?._id) {
  onSubmit(formData, event._id);
} else {
  onSubmit(formData);
}

// ❌ REMOVE manual close

    // ✅ FIX: CLOSE DIALOG
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onOpenChange(false);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription>
            Fill details to {event ? "update" : "create"} event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label>Event Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div>
            <Label>Budget Spent</Label>
            <Input value={budgetSpent} onChange={(e) => setBudgetSpent(e.target.value)} />
          </div>

          <div>
            <Label>Upload Brochure</Label>
            <Input type="file" onChange={(e) => setBrochure(e.target.files?.[0] || null)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              {event ? "Update" : "Create"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;