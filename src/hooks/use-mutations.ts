import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";
/* ================= CLUB ================= */

export const useCreateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/clubs", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
};

export const useUpdateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/clubs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
};

export const useDeleteClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clubs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
};

/* ================= EVENTS ================= */

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/events", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["faculty-events"] });
    },
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/events/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["faculty-events"] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["faculty-events"] });
    },
  });
};

/* ================= STUDENT ================= */

export const useRegisterEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      api.post(`/student/events/${eventId}/register`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-events"] });
      qc.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });
};

export const useCancelRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      api.delete(`/student/events/${eventId}/register`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-events"] });
      qc.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });
};

export const useSubmitFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/student/feedback", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-feedback"] });
    },
  });
};

/* ================= NOTIFICATIONS ================= */

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

/* ================= ADMIN ================= */

export const useAssignFaculty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facultyId,
      clubId,
    }: {
      facultyId: string;
      clubId: string | null;
    }) =>
      api.put(`/admin/faculty/${facultyId}/assign`, { clubId }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["faculty"] }),
  });
};

export const useCreateFaculty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/admin/faculty", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["faculty"] }),
  });
};

export const useDeleteFaculty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/faculty/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["faculty"] }),
  });
};

/* ================= FACULTY ================= */

export const useMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.patch(`/faculty/registrations/${id}/attend`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["faculty-registrations"] }),
  });
};

export const useApproveEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/events/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["faculty-events"] });
    },
  });
};

/* ================= BULK ATTENDANCE ================= */

export const useBulkMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/faculty/attendance/bulk", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-registrations"] });
      qc.invalidateQueries({ queryKey: ["faculty-events"] });
    },
  });
};