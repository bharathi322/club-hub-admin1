import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChangePassword } from "@/hooks/use-mutations";

const roleRedirect: Record<string, string> = {
  admin: "/",
  faculty: "/faculty",
  student: "/student/events",
};

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup({ name, email, password });
        navigate("/student/events");
      } else {
        await login({ email, password });
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.mustChangePassword) {
            setShowPasswordChange(true);
          } else {
            navigate(roleRedirect[parsed.role] || "/");
          }
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate(newPassword, {
      onSuccess: () => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          parsed.mustChangePassword = false;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
        toast({ title: "Password changed successfully" });
        setShowPasswordChange(false);
        navigate(roleRedirect[user?.role || "faculty"] || "/faculty");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
      },
    });
  };

  if (showPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto p-3 rounded-xl bg-gradient-primary w-fit">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">Change Password</CardTitle>
            <CardDescription>
              Please set a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary border-0 hover:opacity-90" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set New Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 rounded-xl bg-gradient-primary w-fit">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold">College Clubs Management</CardTitle>
          <CardDescription>
            {isSignup ? "Create your student account" : "Sign in to your dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@college.edu" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary border-0 hover:opacity-90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Student? Create an account"}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
          {!isSignup && (
            <p className="text-center text-xs text-muted-foreground">
              Faculty accounts are created by admin. Check your email for credentials.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
