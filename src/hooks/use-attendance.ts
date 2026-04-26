import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/api/api";

export const useEventRegistrations = (eventId: string) => {
  return useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      const res = await api.get(`/faculty/events/${eventId}/registrations`);
      return res.data;
    },
    enabled: !!eventId,
  });
};

export const useSubmitAttendance = () => {
  return useMutation({
    mutationFn: async ({ eventId, presentStudentIds }: any) => {
      return api.post(`/faculty/events/${eventId}/attendance`, {
        presentStudentIds,
      });
    },
  });
};