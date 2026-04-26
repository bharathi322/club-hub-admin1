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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [files, setFiles] = useState<File[]>([]);

  // ✅ ADDED (no existing logic changed)
  const [facultyId, setFacultyId] = useState("");

  // ✅ Convert to AM/PM
  const formatTime = (time: string) => {
    if (!time) return "";

    const [hour, minute] = time.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
  };

  // ✅ Edit mode
  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setClub(event.clubId || "");
      setDate(event.date ? event.date.split("T")[0] : "");
      setTime(event.time || "");
      setBudgetSpent(String(event.budgetSpent || 0));
    } else {
      setName("");
      setClub("");
      setDate("");
      setTime("");
      setBudgetSpent("");
      setFiles([]);
    }
  }, [event, open]);

  // ✅ Faculty auto club (existing)
  useEffect(() => {
    if (user?.role === "faculty" && user?.assignedClubs?.length > 0) {
      setClub(user.assignedClubs[0]);
    }
  }, [user]);

  // ✅ NEW: Auto assign faculty when club changes
  useEffect(() => {
    if (!club || !clubs) return;

    const selectedClub = clubs.find(
      (c: any) => String(c._id) === String(club)
    );

    if (selectedClub?.facultyIds?.length > 0) {
      setFacultyId(selectedClub.facultyIds[0]);
    }
  }, [club, clubs]);

  // ✅ Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("clubId", club);
    formData.append("date", date);
    formData.append("time", time);
    formData.append("budgetSpent", String(Number(budgetSpent) || 0));

    // ✅ NEW: send facultyId
    if (facultyId) {
      formData.append("facultyId", facultyId);
    }

    files.forEach((file) => {
      formData.append("attachments", file);
    });

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription>
            Fill the details to {event ? "update" : "create"} an event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Event Name */}
          <div>
            <Label>Event Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Club */}
          {user?.role === "admin" ? (
            <div>
              <Label>Club</Label>
              <Select value={club} onValueChange={setClub}>
                <SelectTrigger>
                  <SelectValue placeholder="Select club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs?.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Club</Label>
              <Input
                value={
                  clubs?.find((c: any) => String(c._id) === String(club))?.name || ""
                }
                disabled
              />
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />

              {time && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {formatTime(time)}
                </p>
              )}
            </div>
          </div>

          {/* Budget */}
          <Input
            type="number"
            value={budgetSpent}
            onChange={(e) => setBudgetSpent(e.target.value)}
            placeholder="Budget"
          />

          {/* Upload */}
          {event && event.status === "completed" && (
            <Input
              type="file"
              multiple
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []))
              }
            />
          )}

          {/* Buttons */}
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

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