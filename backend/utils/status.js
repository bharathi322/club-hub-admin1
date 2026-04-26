export const getClubStatus = (club) => {
  const now = new Date();

  const lastEvent = club.lastEventDate
    ? new Date(club.lastEventDate)
    : null;

  const days = lastEvent
    ? (now - lastEvent) / (1000 * 60 * 60 * 24)
    : 999;

  if (days > 60) return "Critical";

  if (club.eventsCount >= 2 && club.members >= 30)
    return "Healthy";

  return "Warning";
};