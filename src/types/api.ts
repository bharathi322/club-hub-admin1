// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  role?: "student";
}

export interface AuthResponse {
  token: string;
  user: User;
}

// User
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student";
  mustChangePassword?: boolean;
}

// Club
export interface Club {
  _id: string;
  name: string;
  status: "healthy" | "critical" | "warning";
  membersCount: number;
  rating: number;
  budgetAllocated?: number;
  budgetUsed?: number;
}

// Event
export interface Event {
  _id: string;
  name: string;
  club?: string;
  clubId?: string;
  status: "approved" | "pending" | "rejected";
  rating?: string;
  date: string;
  time: string;
  description?: string;
  maxSeats?: number;
  budgetUsed?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Student Event
export interface StudentEvent extends Event {
  registrationStatus: "registered" | "attended" | "cancelled" | null;
  registeredCount?: number;
  seatsRemaining?: number | null;
}

// Event Registration
export interface EventRegistration {
  _id: string;
  eventId: Event;
  studentId: string | { _id: string; name: string; email: string };
  status: "registered" | "attended" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

// Feedback
export interface Feedback {
  _id: string;
  studentId?: { _id: string; name: string };
  eventId?: { _id: string; name: string };
  clubId?: { _id: string; name: string };
  targetType: "club" | "event";
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Faculty Stats
export interface FacultyStats {
  totalEvents: number;
  pendingEvents: number;
  totalRegistrations: number;
  feedbackCount: number;
  clubRating: number;
  totalBudgetUsed?: number;
  budgetAllocated?: number;
}

// Complaints
export interface Complaint {
  _id: string;
  text: string;
  type: "alert" | "rating";
  createdAt: string;
}

// Metrics
export interface DashboardMetrics {
  totalClubs: number;
  eventsThisMonth: number;
  pendingApprovals: number;
  avgRating: number;
}

// Quick Stats
export interface QuickStatsData {
  upcomingEvents: number;
  reportsPending: number;
  totalParticipants: number;
}

// Budget
export interface BudgetData {
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  clubs: {
    name: string;
    allocated: number;
    used: number;
    remaining: number;
  }[];
}

// Budget Overview
export interface BudgetOverviewItem {
  club: { _id: string; name: string };
  faculty: { name: string; email: string } | null;
  budgetAllocated: number;
  budgetUsed: number;
  eventCount: number;
}

// Chart data
export interface MonthlyEventData {
  month: string;
  all: number;
  pending: number;
  confirmed: number;
}

// Calendar
export interface CalendarEvent {
  time: string;
  title: string;
  club: string;
  status: "approved" | "pending" | "warning";
}

export interface CalendarDayEvents {
  date: string;
  events: CalendarEvent[];
}

// Notifications
export interface AppNotification {
  _id: string;
  user: string;
  title: string;
  description: string;
  type: "info" | "warning" | "success";
  read: boolean;
  relatedEvent?: string;
  createdAt: string;
}

// Admin club events
export interface ClubEventsResponse {
  club: Club;
  events: Event[];
}

// Live attendance
export interface LiveAttendanceData {
  total: number;
  attended: number;
  attendanceRate: number;
  registrations: {
    _id: string;
    student: { _id: string; name: string; email: string };
    status: string;
    updatedAt: string;
  }[];
}

// QR scan
export interface QRScanResponse {
  message: string;
  event: { _id: string; name: string; club: string };
  status: string;
}