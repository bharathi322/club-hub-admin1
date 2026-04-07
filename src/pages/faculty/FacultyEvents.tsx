import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, CalendarDays, Clock, Upload, Image, FileText, DollarSign, Send, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useFacultyEvents, useFacultyClub } from "@/hooks/use-dashboard-api";
import {
  useCreateFacultyEvent,
  useUpdateFacultyEvent,
  useDeleteFacultyEvent,
  useUploadEventPhotos,
  useUploadEventDocuments,
  useUploadBudgetProof,
  useSubmitProof,
} from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import EventFormDialog from "@/components/dashboard/EventFormDialog";
import DeleteConfirmDialog from "@/components/dashboard/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/types/api";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const statusDot: Record<string, string> = {
  approved: "bg-[hsl(var(--status-healthy))]",
  pending: "bg-[hsl(var(--status-warning))]",
  warning: "bg-[hsl(var(--status-critical))]",
};

const proofStatusColors: Record<string, string> = {
  pending: "secondary",
  submitted: "outline",
  approved: "default",
  rejected: "destructive",
};

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const FacultyEvents = () => {
  const { data: events, isLoading } = useFacultyEvents();
  const { data: club } = useFacultyClub();
  const createEvent = useCreateFacultyEvent();
  const updateEvent = useUpdateFacultyEvent();
  const deleteEvent = useDeleteFacultyEvent();
  const uploadPhotos = useUploadEventPhotos();
  const uploadDocs = useUploadEventDocuments();
  const uploadBudget = useUploadBudgetProof();
  const submitProof = useSubmitProof();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadEvent, setUploadEvent] = useState<Event | null>(null);
  const [uploadType, setUploadType] = useState<"photos" | "documents" | "budget">("photos");
  const [budgetAmount, setBudgetAmount] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budget info
  const totalBudgetUsed = events?.reduce((s, e) => s + (e.budgetUsed || 0), 0) || 0;
  const budgetAllocated = club?.budgetAllocated || 0;
  const budgetPercent = budgetAllocated > 0 ? Math.round((totalBudgetUsed / budgetAllocated) * 100) : 0;

  const handleSubmit = (data: Partial<Event> & { id?: string }) => {
    const mutation = data.id ? updateEvent : createEvent;
    mutation.mutate(data as any, {
      onSuccess: () => { setFormOpen(false); setEditingEvent(null); toast({ title: data.id ? "Event updated" : "Event created" }); },
      onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteEvent.mutate(deletingId, {
      onSuccess: () => { setDeleteOpen(false); setDeletingId(null); toast({ title: "Event deleted" }); },
      onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
    });
  };

  const openUploadDialog = (event: Event, type: "photos" | "documents" | "budget") => {
    setUploadEvent(event);
    setUploadType(type);
    setBudgetAmount(String(event.budgetUsed || 0));
    setUploadOpen(true);
  };

  const handleFileUpload = () => {
    const files = fileInputRef.current?.files;
    if (!files?.length || !uploadEvent) return;

    const fileArray = Array.from(files);
    const eventId = uploadEvent._id;

    if (uploadType === "photos") {
      uploadPhotos.mutate({ eventId, files: fileArray }, {
        onSuccess: () => { setUploadOpen(false); toast({ title: "Photos uploaded successfully" }); },
        onError: (err: any) => toast({ title: "Upload failed", description: err.response?.data?.message || "Failed", variant: "destructive" }),
      });
    } else if (uploadType === "documents") {
      uploadDocs.mutate({ eventId, files: fileArray }, {
        onSuccess: () => { setUploadOpen(false); toast({ title: "Documents uploaded successfully" }); },
        onError: (err: any) => toast({ title: "Upload failed", description: err.response?.data?.message || "Failed", variant: "destructive" }),
      });
    } else {
      uploadBudget.mutate({ eventId, files: fileArray, budgetUsed: Number(budgetAmount) || 0 }, {
        onSuccess: () => { setUploadOpen(false); toast({ title: "Budget proof uploaded successfully" }); },
        onError: (err: any) => toast({ title: "Upload failed", description: err.response?.data?.message || "Failed", variant: "destructive" }),
      });
    }
  };

  const handleSubmitProof = (eventId: string) => {
    submitProof.mutate(eventId, {
      onSuccess: () => toast({ title: "Proofs submitted for admin review" }),
      onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" }),
    });
  };

  const isUploading = uploadPhotos.isPending || uploadDocs.isPending || uploadBudget.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Club Events</h1>
          <p className="text-sm text-muted-foreground">Manage events, upload proofs & documents</p>
        </div>
        <Button className="gap-2 bg-gradient-primary border-0 hover:opacity-90" onClick={() => { setEditingEvent(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      {/* Budget Bar */}
      {budgetAllocated > 0 && (
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Club Budget</span>
              <span className="text-xs text-muted-foreground">
                ₹{totalBudgetUsed.toLocaleString("en-IN")} / ₹{budgetAllocated.toLocaleString("en-IN")}
              </span>
            </div>
            <Progress value={budgetPercent} className="h-2" />
            {budgetPercent >= 80 && (
              <p className="text-xs text-[hsl(var(--status-warning))] mt-1">
                ⚠️ {budgetPercent}% of budget used
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)
        ) : events?.length ? (
          events.map((event, i) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot[event.status]}`} />
                    <CardTitle className="text-base">{event.name}</CardTitle>
                  </div>
                  <Badge variant={event.status as any} className="capitalize">{event.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {event.time}
                  </div>
                  {(event.budgetUsed ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" /> Budget: ₹{event.budgetUsed?.toLocaleString()}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {(event.photos?.length ?? 0) > 0 && (
                      <Badge variant="outline" className="gap-1"><Image className="h-3 w-3" /> {event.photos!.length} photos</Badge>
                    )}
                    {(event.documents?.length ?? 0) > 0 && (
                      <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {event.documents!.length} docs</Badge>
                    )}
                    {(event.budgetProof?.length ?? 0) > 0 && (
                      <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" /> {event.budgetProof!.length} receipts</Badge>
                    )}
                  </div>

                  {/* Proof Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Proof:</span>
                    <Badge variant={proofStatusColors[event.proofStatus || "pending"] as any} className="capitalize text-xs">
                      {event.proofStatus === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {event.proofStatus === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {event.proofStatus || "pending"}
                    </Badge>
                    {event.proofRemarks && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={event.proofRemarks}>
                        {event.proofRemarks}
                      </span>
                    )}
                  </div>

                  {/* Upload buttons */}
                  <div className="flex gap-1.5 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => openUploadDialog(event, "photos")}>
                      <Image className="h-3 w-3" /> Photos
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => openUploadDialog(event, "documents")}>
                      <FileText className="h-3 w-3" /> Docs
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => openUploadDialog(event, "budget")}>
                      <DollarSign className="h-3 w-3" /> Budget
                    </Button>
                  </div>

                  {/* Submit proof to admin */}
                  {event.proofStatus === "pending" && ((event.photos?.length ?? 0) > 0 || (event.documents?.length ?? 0) > 0) && (
                    <Button
                      size="sm"
                      className="w-full gap-1 bg-gradient-primary border-0 hover:opacity-90 text-xs"
                      onClick={() => handleSubmitProof(event._id)}
                      disabled={submitProof.isPending}
                    >
                      <Send className="h-3 w-3" /> Submit Proofs for Review
                    </Button>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditingEvent(event); setFormOpen(true); }}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => { setDeletingId(event._id); setDeleteOpen(true); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-12">No events yet. Create one!</p>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Upload {uploadType === "budget" ? "Budget Proof" : uploadType} — {uploadEvent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadType === "budget" && (
              <div className="space-y-2">
                <Label>Budget Used (₹)</Label>
                <Input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Select Files</Label>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept={uploadType === "photos" ? "image/*" : uploadType === "documents" ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" : "image/*,.pdf"}
              />
              <p className="text-xs text-muted-foreground">
                {uploadType === "photos" ? "Upload event photos (JPG, PNG, etc.)" :
                 uploadType === "documents" ? "Upload event reports & documents" :
                 "Upload budget receipts as proof"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button className="gap-2 bg-gradient-primary border-0" onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : <><Upload className="h-4 w-4" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventFormDialog open={formOpen} onOpenChange={setFormOpen} event={editingEvent} onSubmit={handleSubmit} isLoading={createEvent.isPending || updateEvent.isPending} />
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Event" description="Are you sure? This cannot be undone." onConfirm={handleDelete} isLoading={deleteEvent.isPending} />
    </div>
  );
};

export default FacultyEvents;
