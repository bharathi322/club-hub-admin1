import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Club, Event } from "@/types/api";

// Club mutations (admin)
export const useCreateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Club>) => api.post("/clubs", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

export const useUpdateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Club> & { id: string }) =>
      api.put(`/clubs/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

export const useDeleteClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clubs/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

// Event mutations (admin)
export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => api.post("/events", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["monthlyEvents"] });
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
      qc.invalidateQueries({ queryKey: ["quickStats"] });
    },
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Event> & { id: string }) =>
      api.put(`/events/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["monthlyEvents"] });
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["monthlyEvents"] });
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
      qc.invalidateQueries({ queryKey: ["quickStats"] });
    },
  });
};

// Student mutations
export const useRegisterForEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.post(`/student/events/${eventId}/register`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studentEvents"] });
      qc.invalidateQueries({ queryKey: ["myRegistrations"] });
    },
  });
};

export const useCancelRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.delete(`/student/events/${eventId}/register`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studentEvents"] });
      qc.invalidateQueries({ queryKey: ["myRegistrations"] });
    },
  });
};

export const useSubmitFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: "club" | "event"; targetId: string; rating: number; comment: string }) =>
      api.post("/student/feedback", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studentClubs"] });
      qc.invalidateQueries({ queryKey: ["studentEvents"] });
    },
  });
};

// Faculty mutations
export const useCreateFacultyEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => api.post("/faculty/events", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

export const useUpdateFacultyEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Event> & { id: string }) =>
      api.put(`/faculty/events/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

export const useDeleteFacultyEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/faculty/events/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

// Notification mutations
export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/faculty/registrations/${id}/attend`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyRegistrations"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

export const useBulkMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      api.patch("/faculty/registrations/bulk-attend", { ids, status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyRegistrations"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

export const useUpdateFacultyClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Club>) => api.put("/faculty/my-club", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyClub"] });
    },
  });
};
