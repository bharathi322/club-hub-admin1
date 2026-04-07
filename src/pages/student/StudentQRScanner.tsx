import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { useScanQR } from "@/hooks/use-mutations";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const StudentQRScanner = () => {
  const [qrValue, setQrValue] = useState("");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; event?: string } | null>(null);
  const scanQR = useScanQR();
  const { toast } = useToast();

  const handleScan = (token: string) => {
    if (!token) return;
    scanQR.mutate(token, {
      onSuccess: (data) => {
        setScanResult({ success: true, message: data.message, event: data.event?.name });
        toast({ title: "✅ Check-in Successful!", description: `Welcome to ${data.event?.name}` });
      },
      onError: (err: any) => {
        setScanResult({ success: false, message: err.response?.data?.message || "Scan failed" });
        toast({ title: "Check-in Failed", description: err.response?.data?.message || "Failed", variant: "destructive" });
      },
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(qrValue.trim());
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Event Check-in</h1>
        <p className="text-sm text-muted-foreground">Scan the QR code shown by your faculty to check in</p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Manual QR entry */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5" /> Enter Check-in Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask your faculty for the check-in code, or scan the QR code displayed at the event.
              </p>
              <Input
                placeholder="Paste check-in code here..."
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
              />
              <Button
                type="submit"
                className="w-full gap-2 bg-gradient-primary border-0 hover:opacity-90"
                disabled={scanQR.isPending || !qrValue.trim()}
              >
                <Camera className="h-4 w-4" />
                {scanQR.isPending ? "Checking in..." : "Check In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {scanResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`shadow-card border-2 ${scanResult.success ? "border-[hsl(var(--status-healthy))]" : "border-destructive"}`}>
              <CardContent className="pt-6 text-center space-y-3">
                {scanResult.success ? (
                  <>
                    <CheckCircle className="h-16 w-16 mx-auto text-[hsl(var(--status-healthy))]" />
                    <h2 className="text-xl font-bold text-foreground">Check-in Successful!</h2>
                    {scanResult.event && (
                      <p className="text-muted-foreground">Welcome to <strong>{scanResult.event}</strong></p>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                    <h2 className="text-xl font-bold text-foreground">Check-in Failed</h2>
                    <p className="text-muted-foreground">{scanResult.message}</p>
                  </>
                )}
                <Button variant="outline" onClick={() => { setScanResult(null); setQrValue(""); }}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentQRScanner;
