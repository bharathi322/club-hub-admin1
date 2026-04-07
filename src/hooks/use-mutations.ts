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

// Faculty file uploads
export const useUploadEventPhotos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, files }: { eventId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach(f => formData.append("photos", f));
      return api.post(`/faculty/events/${eventId}/upload-photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
    },
  });
};

export const useUploadEventDocuments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, files }: { eventId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach(f => formData.append("documents", f));
      return api.post(`/faculty/events/${eventId}/upload-documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
    },
  });
};

export const useUploadBudgetProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, files, budgetUsed }: { eventId: string; files: File[]; budgetUsed: number }) => {
      const formData = new FormData();
      files.forEach(f => formData.append("budgetProof", f));
      formData.append("budgetUsed", String(budgetUsed));
      return api.post(`/faculty/events/${eventId}/upload-budget-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

export const useUpdateEventBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, budgetUsed }: { eventId: string; budgetUsed: number }) =>
      api.put(`/faculty/events/${eventId}/budget`, { budgetUsed }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
      qc.invalidateQueries({ queryKey: ["facultyStats"] });
    },
  });
};

// Faculty: submit proofs for admin review
export const useSubmitProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.post(`/faculty/events/${eventId}/submit-proof`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facultyEvents"] });
    },
  });
};

// Admin: review proof
export const useReviewProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status, remarks }: { eventId: string; status: string; remarks: string }) =>
      api.put(`/admin/events/${eventId}/review-proof`, { status, remarks }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminClubEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

// Admin: allocate budget
export const useAllocateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, budgetAllocated }: { clubId: string; budgetAllocated: number }) =>
      api.put(`/admin/clubs/${clubId}/budget`, { budgetAllocated }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["budgetOverview"] });
    },
  });
};

// Admin: create faculty
export const useCreateFaculty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; clubId?: string }) =>
      api.post("/admin/faculty", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminFaculty"] });
    },
  });
};

// Admin: assign faculty to club
export const useAssignFaculty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facultyId, clubId }: { facultyId: string; clubId: string }) =>
      api.put(`/admin/faculty/${facultyId}/assign`, { clubId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminFaculty"] });
    },
  });
};

// Admin: recalculate health
export const useRecalculateHealth = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/admin/recalculate-health").then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

// QR Attendance
export const useGenerateQR = () => {
  return useMutation({
    mutationFn: (eventId: string) => api.post(`/attendance/generate-qr/${eventId}`).then(r => r.data),
  });
};

export const useScanQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qrToken: string) => api.post("/attendance/scan", { qrToken }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myRegistrations"] });
    },
  });
};

// Student: upload photos
export const useStudentUploadPhotos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, files }: { eventId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach(f => formData.append("photos", f));
      return api.post(`/student/events/${eventId}/upload-photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myRegistrations"] });
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

// Auth: change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (newPassword: string) =>
      api.post("/auth/change-password", { newPassword }).then(r => r.data),
  });
};
