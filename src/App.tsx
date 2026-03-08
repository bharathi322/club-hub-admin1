import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Clubs from "./pages/Clubs";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import FacultyAssignment from "./pages/FacultyAssignment";
import NotFound from "./pages/NotFound";

// Student pages
import StudentEvents from "./pages/student/StudentEvents";
import StudentClubs from "./pages/student/StudentClubs";
import StudentMyRegistrations from "./pages/student/StudentMyRegistrations";
import StudentProfile from "./pages/student/StudentProfile";

// Faculty pages
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyEvents from "./pages/faculty/FacultyEvents";
import FacultyMembers from "./pages/faculty/FacultyMembers";
import FacultyFeedback from "./pages/faculty/FacultyFeedback";

const queryClient = new QueryClient();

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const demoMode = localStorage.getItem("demoMode");
  const role = demoMode || user?.role;
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin routes */}
            <Route path="/" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><Index /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/clubs" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><Clubs /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><Events /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><Reports /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><Settings /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/faculty-assignment" element={<ProtectedRoute><RoleRoute allowedRoles={["admin"]}><DashboardLayout><FacultyAssignment /></DashboardLayout></RoleRoute></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/student/events" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><DashboardLayout><StudentEvents /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/student/clubs" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><DashboardLayout><StudentClubs /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/student/registrations" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><DashboardLayout><StudentMyRegistrations /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><DashboardLayout><StudentProfile /></DashboardLayout></RoleRoute></ProtectedRoute>} />

            {/* Faculty routes */}
            <Route path="/faculty" element={<ProtectedRoute><RoleRoute allowedRoles={["faculty"]}><DashboardLayout><FacultyDashboard /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/faculty/events" element={<ProtectedRoute><RoleRoute allowedRoles={["faculty"]}><DashboardLayout><FacultyEvents /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/faculty/members" element={<ProtectedRoute><RoleRoute allowedRoles={["faculty"]}><DashboardLayout><FacultyMembers /></DashboardLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/faculty/feedback" element={<ProtectedRoute><RoleRoute allowedRoles={["faculty"]}><DashboardLayout><FacultyFeedback /></DashboardLayout></RoleRoute></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
