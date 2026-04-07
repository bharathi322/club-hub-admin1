import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Club,
  Event,
  Complaint,
  DashboardMetrics,
  QuickStatsData,
  BudgetData,
  MonthlyEventData,
  CalendarDayEvents,
  StudentEvent,
  EventRegistration,
  FacultyStats,
  Feedback,
  AppNotification,
  ClubEventsResponse,
  BudgetOverviewItem,
  LiveAttendanceData,
} from "@/types/api";

// Admin hooks
export const useMetrics = () =>
  useQuery<DashboardMetrics>({
    queryKey: ["metrics"],
    queryFn: async () => (await api.get("/dashboard/metrics")).data,
  });

export const useClubs = () =>
  useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: async () => (await api.get("/clubs")).data,
  });

export const useEvents = () =>
  useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events")).data,
  });

export const useQuickStats = () =>
  useQuery<QuickStatsData>({
    queryKey: ["quickStats"],
    queryFn: async () => (await api.get("/dashboard/quick-stats")).data,
  });

export const useComplaints = () =>
  useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => (await api.get("/complaints")).data,
  });

export const useBudget = () =>
  useQuery<BudgetData>({
    queryKey: ["budget"],
    queryFn: async () => (await api.get("/dashboard/budget")).data,
  });

export const useMonthlyEvents = () =>
  useQuery<MonthlyEventData[]>({
    queryKey: ["monthlyEvents"],
    queryFn: async () => (await api.get("/dashboard/monthly-events")).data,
  });

export const useCalendarEvents = (date: string) =>
  useQuery<CalendarDayEvents>({
    queryKey: ["calendarEvents", date],
    queryFn: async () => (await api.get(`/dashboard/calendar/${date}`)).data,
    enabled: !!date,
  });

// Student hooks
export const useStudentEvents = () =>
  useQuery<StudentEvent[]>({
    queryKey: ["studentEvents"],
    queryFn: async () => (await api.get("/student/events")).data,
  });

export const useStudentClubs = () =>
  useQuery<Club[]>({
    queryKey: ["studentClubs"],
    queryFn: async () => (await api.get("/student/clubs")).data,
  });

export const useMyRegistrations = () =>
  useQuery<EventRegistration[]>({
    queryKey: ["myRegistrations"],
    queryFn: async () => (await api.get("/student/my-registrations")).data,
  });

// Faculty hooks
export const useFacultyClub = () =>
  useQuery<Club>({
    queryKey: ["facultyClub"],
    queryFn: async () => (await api.get("/faculty/my-club")).data,
  });

export const useFacultyEvents = () =>
  useQuery<Event[]>({
    queryKey: ["facultyEvents"],
    queryFn: async () => (await api.get("/faculty/events")).data,
  });

export const useFacultyStats = () =>
  useQuery<FacultyStats>({
    queryKey: ["facultyStats"],
    queryFn: async () => (await api.get("/faculty/stats")).data,
  });

export const useFacultyFeedback = () =>
  useQuery<{ clubFeedback: Feedback[]; eventFeedback: Feedback[] }>({
    queryKey: ["facultyFeedback"],
    queryFn: async () => (await api.get("/faculty/feedback")).data,
  });

export const useFacultyRegistrations = () =>
  useQuery<any[]>({
    queryKey: ["facultyRegistrations"],
    queryFn: async () => (await api.get("/faculty/registrations")).data,
  });

// Notifications
export const useNotifications = () =>
  useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
  });

// Admin: club events with documents
export const useAdminClubEvents = (clubId: string) =>
  useQuery<ClubEventsResponse>({
    queryKey: ["adminClubEvents", clubId],
    queryFn: async () => (await api.get(`/admin/clubs/${clubId}/events`)).data,
    enabled: !!clubId,
  });

// Admin: budget overview
export const useBudgetOverview = () =>
  useQuery<BudgetOverviewItem[]>({
    queryKey: ["budgetOverview"],
    queryFn: async () => (await api.get("/admin/budget-overview")).data,
  });

// Admin: faculty list
export const useAdminFaculty = () =>
  useQuery<any[]>({
    queryKey: ["adminFaculty"],
    queryFn: async () => (await api.get("/admin/faculty")).data,
  });

// Live attendance
export const useLiveAttendance = (eventId: string) =>
  useQuery<LiveAttendanceData>({
    queryKey: ["liveAttendance", eventId],
    queryFn: async () => (await api.get(`/attendance/${eventId}/live`)).data,
    enabled: !!eventId,
    refetchInterval: 5000, // Poll every 5s as fallback
  });
