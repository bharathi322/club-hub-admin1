import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Users, CheckCircle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useFacultyEvents, useLiveAttendance } from "@/hooks/use-dashboard-api";
import { useGenerateQR } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSocket } from "@/lib/socket";
import { motion } from "framer-motion";
import type { Event } from "@/types/api";

const FacultyQRAttendance = () => {
  const { data: events, isLoading } = useFacultyEvents();
  const generateQR = useGenerateQR();
  const { toast } = useToast();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [qrToken, setQrToken] = useState<string>("");
  const { data: liveData } = useLiveAttendance(activeEvent?._id || "");
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  // Listen for real-time attendance updates
  useEffect(() => {
    const socket = getSocket();
    const handler = (data: any) => {
      if (activeEvent && data.eventId === activeEvent._id) {
        setRealtimeUpdates((prev) => [data, ...prev]);
        toast({
          title: "✅ Check-in!",
          description: `${data.student?.name || "Student"} checked in`,
        });
      }
    };
    socket.on("attendance-update", handler);
    return () => { socket.off("attendance-update", handler); };
  }, [activeEvent]);

  const handleGenerateQR = (event: Event) => {
    generateQR.mutate(event._id, {
      onSuccess: (data) => {
        setQrToken(data.qrToken);
        setActiveEvent(event);
        setRealtimeUpdates([]);
        toast({ title: "QR Code generated!" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
      },
    });
  };

  const todayEvents = events?.filter((e) => e.date === new Date().toISOString().split("T")[0]) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QR Attendance</h1>
        <p className="text-sm text-muted-foreground">Generate QR codes for event check-in</p>
      </div>

      {activeEvent && qrToken ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> {activeEvent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="bg-card p-6 rounded-xl border">
                  <QRCodeSVG value={qrToken} size={280} level="H" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Students scan this QR code to check in
                </p>
                <Button variant="outline" onClick={() => { setActiveEvent(null); setQrToken(""); }}>
                  Close QR
                </Button>
              </CardContent>
            </Card>

            {/* Live Attendance */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Live Attendance
                  {liveData && (
                    <Badge variant="secondary" className="ml-auto">
                      {liveData.attended}/{liveData.total} ({liveData.attendanceRate}%)
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveData.registrations.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="font-medium">{r.student?.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "attended" ? "default" : "secondary"} className="capitalize">
                              {r.status === "attended" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        <>
          {todayEvents.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Today's Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayEvents.map((event) => (
                  <Card key={event._id} className="shadow-card">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-card-foreground">{event.name}</h3>
                        <Badge variant="secondary">{event.time}</Badge>
                      </div>
                      <Button
                        className="w-full gap-2 bg-gradient-primary border-0 hover:opacity-90"
                        onClick={() => handleGenerateQR(event)}
                        disabled={generateQR.isPending}
                      >
                        {generateQR.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                        Take Attendance
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">All Events</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events?.map((event) => (
                  <Card key={event._id} className="shadow-card">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-card-foreground">{event.name}</h3>
                        <Badge variant="secondary">{event.date}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleGenerateQR(event)}
                        disabled={generateQR.isPending}
                      >
                        <QrCode className="h-4 w-4" /> Generate QR
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyQRAttendance;
