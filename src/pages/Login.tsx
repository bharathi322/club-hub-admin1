import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // SIGNUP
      if (isSignup) {
        await signup({
          name,
          email,
          password,
          studentId,
        });

        localStorage.setItem("otpEmail", email);

        toast({
          title: "OTP Sent",
          description: "Check your email",
        });

        navigate("/verify-otp");
      }

      // LOGIN
      else {
        await login({ email, password });

        const user = JSON.parse(localStorage.getItem("user") || "{}");

        toast({
          title: "Login successful",
        });

        if (user.role === "admin") navigate("/admin");
        else if (user.role === "faculty") navigate("/faculty");
        else navigate("/student/events");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 rounded-xl bg-gradient-primary w-fit">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>

          <CardTitle className="text-xl font-bold">
            College Clubs Management
          </CardTitle>

          <CardDescription>
            {isSignup ? "Create your account" : "Login to continue"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            {isSignup && (
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* STUDENT ID */}
            {isSignup && (
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your Student ID"
                  required
                />
              </div>
            )}

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {/* TOGGLE */}
          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-medium"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>

          {!isSignup && (
            <p className="text-center text-xs text-muted-foreground">
              Faculty accounts are created by admin
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;