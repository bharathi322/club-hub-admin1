import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OTP_LENGTH = 6;

const VerifyOtp = () => {
  const { verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const email = localStorage.getItem("otpEmail") || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split("");
    while (newOtp.length < OTP_LENGTH) newOtp.push("");

    setOtp(newOtp);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== OTP_LENGTH) {
      toast({
        title: "Error",
        description: "Enter complete OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      await verifyOtp(email, finalOtp);

      toast({
        title: "Success",
        description: "Account verified",
      });

      navigate("/student");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = () => {
    const m = Math.floor(timer / 60);
    const s = timer % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 rounded-xl bg-gradient-primary w-fit">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>

          <CardTitle>Verify your account</CardTitle>
          <CardDescription>
            Enter the OTP sent to your email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                className="w-10 h-12 text-center text-lg"
              />
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            OTP expires in {formatTime()}
          </div>

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify OTP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOtp;