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
import { Loader2 } from "lucide-react";
import type { Club } from "@/types/api";

interface ClubFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club?: Club | null;
  onSubmit: (data: Partial<Club> & { id?: string }) => void;
  isLoading: boolean;
}

const ClubFormDialog = ({
  open,
  onOpenChange,
  club,
  onSubmit,
  isLoading,
}: ClubFormDialogProps) => {

  // ✅ ONLY REAL FIELDS
  const [name, setName] = useState("");
  const [budgetAllocated, setBudgetAllocated] = useState("");

  useEffect(() => {
    if (club) {
      setName(club.name);
      setBudgetAllocated(String(club.budgetAllocated || 0));
    } else {
      setName("");
      setBudgetAllocated("");
    }
  }, [club, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...(club ? { id: club._id } : {}),
      name,
      budgetAllocated: Number(budgetAllocated) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {club ? "Edit Club" : "Add New Club"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* CLUB NAME */}
          <div className="space-y-2">
            <Label htmlFor="club-name">Club Name</Label>
            <Input
              id="club-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coding Club"
              required
            />
          </div>

          {/* BUDGET */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Allocated</Label>
            <Input
              id="budget"
              type="number"
              value={budgetAllocated}
              onChange={(e) => setBudgetAllocated(e.target.value)}
              placeholder="Enter budget"
            />
          </div>

          {/* OPTIONAL READ-ONLY INFO (SAFE DISPLAY) */}
          {club && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <Label>Status</Label>
                <Input value={club.healthStatus} disabled />
              </div>
              <div>
                <Label>Members</Label>
                <Input value={club.membersCount} disabled />
              </div>
              <div>
                <Label>Rating</Label>
                <Input value={club.rating} disabled />
              </div>
            </div>
          )}

          {/* FOOTER */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-gradient-primary border-0"
              disabled={isLoading}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {club ? "Update" : "Create"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClubFormDialog;