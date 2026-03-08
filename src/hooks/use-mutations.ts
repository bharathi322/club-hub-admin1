import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Club, Event } from "@/types/api";

// Club mutations
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

// Event mutations
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
