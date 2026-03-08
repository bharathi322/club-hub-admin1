import type {
  Club,
  Event,
  Complaint,
  DashboardMetrics,
  QuickStatsData,
  BudgetData,
  MonthlyEventData,
  CalendarDayEvents,
  CalendarEvent,
  StudentEvent,
  EventRegistration,
  Feedback,
  FacultyStats,
  AppNotification,
} from "@/types/api";

export const mockClubs: Club[] = [
  { _id: "c1", name: "Robotics Club", status: "healthy", membersCount: 45, rating: 4.8 },
  { _id: "c2", name: "Drama Society", status: "healthy", membersCount: 32, rating: 4.5 },
  { _id: "c3", name: "Debate Club", status: "warning", membersCount: 28, rating: 3.9 },
  { _id: "c4", name: "Music Club", status: "healthy", membersCount: 51, rating: 4.7 },
  { _id: "c5", name: "Photography Club", status: "critical", membersCount: 12, rating: 3.2 },
  { _id: "c6", name: "Coding Club", status: "healthy", membersCount: 64, rating: 4.9 },
];

export const mockEvents: Event[] = [
  { _id: "e1", name: "Annual Robo Wars", club: "Robotics Club", status: "approved", rating: "4.8", date: "2026-03-15", time: "10:00 AM" },
  { _id: "e2", name: "Spring Play Auditions", club: "Drama Society", status: "pending", rating: "4.2", date: "2026-03-18", time: "2:00 PM" },
  { _id: "e3", name: "Inter-College Debate", club: "Debate Club", status: "approved", rating: "4.5", date: "2026-03-20", time: "9:00 AM" },
  { _id: "e4", name: "Open Mic Night", club: "Music Club", status: "approved", rating: "4.9", date: "2026-03-22", time: "7:00 PM" },
  { _id: "e5", name: "Photo Walk", club: "Photography Club", status: "warning", rating: "3.5", date: "2026-03-25", time: "6:00 AM" },
  { _id: "e6", name: "Hackathon 2026", club: "Coding Club", status: "pending", rating: "4.7", date: "2026-03-28", time: "8:00 AM" },
  { _id: "e7", name: "Workshop: AI Basics", club: "Coding Club", status: "approved", rating: "4.6", date: "2026-04-02", time: "11:00 AM" },
  { _id: "e8", name: "Drama Festival", club: "Drama Society", status: "approved", rating: "4.3", date: "2026-04-05", time: "5:00 PM" },
];

export const mockStudentEvents: StudentEvent[] = mockEvents
  .filter(e => e.status === "approved")
  .map((e, i) => ({ ...e, registrationStatus: i === 0 ? "registered" as const : null }));

export const mockMyRegistrations: EventRegistration[] = [
  { _id: "r1", event: mockEvents[0], student: "demo-student", status: "registered", createdAt: "2026-03-07T10:00:00Z" },
];

export const mockFacultyStats: FacultyStats = {
  totalEvents: 3,
  pendingEvents: 1,
  totalRegistrations: 45,
  feedbackCount: 12,
  clubRating: 4.8,
};

export const mockFacultyEvents: Event[] = mockEvents.filter(e => e.club === "Robotics Club");

export const mockFeedback: { clubFeedback: Feedback[]; eventFeedback: Feedback[] } = {
  clubFeedback: [
    { _id: "f1", student: { _id: "s1", name: "Alice Johnson" }, targetType: "club", targetId: "c1", rating: 5, comment: "Amazing club!", createdAt: "2026-03-06T10:00:00Z" },
    { _id: "f2", student: { _id: "s2", name: "Bob Smith" }, targetType: "club", targetId: "c1", rating: 4, comment: "Great activities", createdAt: "2026-03-05T14:00:00Z" },
  ],
  eventFeedback: [
    { _id: "f3", student: { _id: "s3", name: "Carol Davis" }, targetType: "event", targetId: "e1", rating: 5, comment: "Best event ever!", createdAt: "2026-03-04T16:00:00Z" },
  ],
};

export const mockComplaints: Complaint[] = [
  { _id: "cp1", text: "Robotics lab equipment needs maintenance", type: "alert", createdAt: "2026-03-07T14:30:00Z" },
  { _id: "cp2", text: "Drama Society rated below expectations", type: "rating", createdAt: "2026-03-06T10:15:00Z" },
  { _id: "cp3", text: "Photography Club missing budget report", type: "alert", createdAt: "2026-03-05T09:00:00Z" },
  { _id: "cp4", text: "Music Club received 5-star feedback", type: "rating", createdAt: "2026-03-04T16:45:00Z" },
];

export const mockMetrics: DashboardMetrics = {
  totalClubs: 6,
  eventsThisMonth: 8,
  pendingApprovals: 2,
  avgRating: 4.3,
};

export const mockQuickStats: QuickStatsData = {
  upcomingEvents: 5,
  reportsPending: 3,
  totalParticipants: 232,
};

export const mockBudget: BudgetData = {
  budgetUsed: 18500,
  budgetTotal: 30000,
  photosUploaded: 142,
  reportsPending: 3,
};

export const mockMonthlyEvents: MonthlyEventData[] = [
  { month: "Oct", all: 12, pending: 3, confirmed: 9 },
  { month: "Nov", all: 18, pending: 5, confirmed: 13 },
  { month: "Dec", all: 8, pending: 2, confirmed: 6 },
  { month: "Jan", all: 15, pending: 4, confirmed: 11 },
  { month: "Feb", all: 20, pending: 6, confirmed: 14 },
  { month: "Mar", all: 22, pending: 7, confirmed: 15 },
];

export const mockCalendarEvents: Record<string, CalendarEvent[]> = {
  "2026-03-08": [
    { time: "10:00 AM", title: "Club Leaders Meeting", club: "All Clubs", status: "approved" },
    { time: "2:00 PM", title: "Budget Review", club: "Admin", status: "pending" },
  ],
  "2026-03-15": [
    { time: "10:00 AM", title: "Annual Robo Wars", club: "Robotics Club", status: "approved" },
  ],
  "2026-03-18": [
    { time: "2:00 PM", title: "Spring Play Auditions", club: "Drama Society", status: "pending" },
  ],
  "2026-03-20": [
    { time: "9:00 AM", title: "Inter-College Debate", club: "Debate Club", status: "approved" },
  ],
  "2026-03-22": [
    { time: "7:00 PM", title: "Open Mic Night", club: "Music Club", status: "approved" },
  ],
};

export function getMockCalendarEvents(date: string): CalendarDayEvents {
  return {
    date,
    events: mockCalendarEvents[date] || [],
  };
}
