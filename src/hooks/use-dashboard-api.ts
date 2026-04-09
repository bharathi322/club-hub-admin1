import { useQuery } from "@tanstack/react-query";
import api from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";

// COMMON FETCH
const fetchData = async (url: string) => {
  try {
    const res = await api.get(url);

    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.events)) return res.data.events;

    return res.data || [];
  } catch (err) {
    console.error("API ERROR:", err);
    return [];
  }
};

/* ================= DASHBOARD ================= */

export const useMetrics = () =>
  useQuery({
    queryKey: ["metrics"],
    queryFn: () => fetchData("/dashboard/metrics"),
  });

export const useQuickStats = () =>
  useQuery({
    queryKey: ["quick-stats"],
    queryFn: () => fetchData("/dashboard/quick-stats"),
  });

export const useBudget = () =>
  useQuery({
    queryKey: ["budget"],
    queryFn: () => fetchData("/dashboard/budget"),
  });

export const useBudgetOverview = () =>
  useQuery({
    queryKey: ["budget-overview"],
    queryFn: () => fetchData("/admin/budget-overview"),
  });

export const useMonthlyEvents = () =>
  useQuery({
    queryKey: ["monthly-events"],
    queryFn: () => fetchData("/dashboard/monthly-events"),
  });

export const useCalendarEvents = (date?: string) =>
  useQuery({
    queryKey: ["calendar-events", date],
    queryFn: async () => {
      if (!date) return { events: [] };
      const res = await api.get(`/dashboard/calendar/${date}`);
      return res.data;
    },
    enabled: !!date,
  });

/* ================= CLUBS ================= */

export const useClubs = () =>
  useQuery({
    queryKey: ["clubs"],
    queryFn: () => fetchData("/clubs"),
  });

/* ================= EVENTS ================= */

export const useEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["events"],
    queryFn: () => fetchData("/events"),
    enabled: !!user,
  });
};

/* ================= NOTIFICATIONS ================= */

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchData("/notifications"),
  });

/* ================= FACULTY ================= */

export const useFacultyStats = () =>
  useQuery({
    queryKey: ["faculty-stats"],
    queryFn: () => fetchData("/faculty/stats"),
  });

export const useFacultyEvents = () =>
  useQuery({
    queryKey: ["faculty-events"],
    queryFn: () => fetchData("/faculty/events"),
  });

export const useFacultyClub = () =>
  useQuery({
    queryKey: ["faculty-club"],
    queryFn: () => fetchData("/faculty/my-club"),
  });

export const useFacultyRegistrations = () =>
  useQuery({
    queryKey: ["faculty-registrations"],
    queryFn: () => fetchData("/faculty/registrations"),
  });

/* ================= STUDENT ================= */

export const useStudentEvents = () =>
  useQuery({
    queryKey: ["student-events"],
    queryFn: () => fetchData("/student/events"),
  });

export const useMyRegistrations = () =>
  useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => fetchData("/student/my-registrations"),
  });

export const useMyFeedback = () =>
  useQuery({
    queryKey: ["my-feedback"],
    queryFn: () => fetchData("/student/my-feedback"),
  });

export const useStudentClubs = () =>
  useQuery({
    queryKey: ["student-clubs"],
    queryFn: () => fetchData("/clubs"),
  });

/* ================= COMPLAINTS ================= */

export const useComplaints = () =>
  useQuery({
    queryKey: ["complaints"],
    queryFn: () => fetchData("/complaints"),
  });