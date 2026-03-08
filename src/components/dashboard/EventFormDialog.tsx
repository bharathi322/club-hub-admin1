import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import type { Event } from "@/types/api";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSubmit: (data: Partial<Event> & { id?: string }) => void;
  isLoading: boolean;
}

const EventFormDialog = ({ open, onOpenChange, event, onSubmit, isLoading }: EventFormDialogProps) => {
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [status, setStatus] = useState("pending");
  const [rating, setRating] = useState("--");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (event) {
      setName(event.name);
      setClub(event.club);
      setStatus(event.status);
      setRating(event.rating);
      setDate(event.date);
      setTime(event.time);
    } else {
      setName("");
      setClub("");
      setStatus("pending");
      setRating("--");
      setDate("");
      setTime("");
    }
  }, [event, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(event ? { id: event._id } : {}),
      name,
      club,
      status: status as Event["status"],
      rating,
      date,
      time,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input id="event-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hackathon 2026" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-club">Club</Label>
            <Input id="event-club" value={club} onChange={(e) => setClub(e.target.value)} placeholder="e.g. Coding Club" required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Time</Label>
              <Input id="event-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="09:00 AM" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-rating">Rating</Label>
            <Input id="event-rating" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="--" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary border-0" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
