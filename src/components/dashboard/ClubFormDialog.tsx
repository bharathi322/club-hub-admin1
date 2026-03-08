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
import type { Club } from "@/types/api";

interface ClubFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club?: Club | null;
  onSubmit: (data: Partial<Club> & { id?: string }) => void;
  isLoading: boolean;
}

const ClubFormDialog = ({ open, onOpenChange, club, onSubmit, isLoading }: ClubFormDialogProps) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("healthy");
  const [membersCount, setMembersCount] = useState("");
  const [rating, setRating] = useState("");

  useEffect(() => {
    if (club) {
      setName(club.name);
      setStatus(club.status);
      setMembersCount(String(club.membersCount));
      setRating(String(club.rating));
    } else {
      setName("");
      setStatus("healthy");
      setMembersCount("");
      setRating("");
    }
  }, [club, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(club ? { id: club._id } : {}),
      name,
      status: status as Club["status"],
      membersCount: Number(membersCount) || 0,
      rating: Number(rating) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{club ? "Edit Club" : "Add New Club"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-name">Club Name</Label>
            <Input id="club-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coding Club" required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="members">Members</Label>
              <Input id="members" type="number" value={membersCount} onChange={(e) => setMembersCount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input id="rating" type="number" step="0.1" max="5" min="0" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary border-0" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {club ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClubFormDialog;
