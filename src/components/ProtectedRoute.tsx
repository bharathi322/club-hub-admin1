import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  role?: string;
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // not logged in
  if (!user) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return null;
  }

  // role-based redirect
  if (role && user.role !== role) {
    let target = "/";

    if (user.role === "faculty") target = "/faculty";
    if (user.role === "student") target = "/student/events";

    if (location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  return <>{children}</>;
}