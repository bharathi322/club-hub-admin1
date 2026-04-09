import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  role?: string;
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // wait for auth to load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // not logged in
  if (!user) {
    // prevent redirect loop
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return null;
  }

  // role check
  if (role && user.role !== role) {
    let target = "/";

    if (user.role === "faculty") target = "/faculty";
    if (user.role === "student") target = "/student/events";

    // prevent loop
    if (location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;