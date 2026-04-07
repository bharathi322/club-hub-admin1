const Club = require("../models/Club");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");

/**
 * Recalculate club health and rating automatically.
 * Factors:
 *  - Events conducted ratio (20%)
 *  - Student participation rate (20%)
 *  - Average feedback rating (25%)
 *  - Proof submission rate (15%)
 *  - Budget utilization (10%)
 *  - Attendance rate (10%)
 */
async function recalculateClubHealth(clubId) {
  try {
    const club = await Club.findById(clubId);
    if (!club) return null;

    const events = await Event.find({ club: club.name });
    const eventIds = events.map((e) => e._id);

    // 1. Events conducted (past events that are approved)
    const today = new Date().toISOString().split("T")[0];
    const pastEvents = events.filter((e) => e.date <= today);
    const approvedPast = pastEvents.filter((e) => e.status === "approved");
    const eventScore = pastEvents.length > 0 ? (approvedPast.length / pastEvents.length) : 0.5;

    // 2. Participation rate (registrations per event)
    const totalRegs = await EventRegistration.countDocuments({ event: { $in: eventIds } });
    const avgRegsPerEvent = events.length > 0 ? totalRegs / events.length : 0;
    const participationScore = Math.min(avgRegsPerEvent / 20, 1); // 20 regs = perfect

    // 3. Feedback rating
    const feedbacks = await Feedback.find({
      $or: [
        { targetType: "club", targetId: clubId },
        { targetType: "event", targetId: { $in: eventIds } },
      ],
    });
    const avgFeedback = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 3;
    const feedbackScore = avgFeedback / 5;

    // 4. Proof submission rate
    const eventsWithProofs = events.filter(
      (e) => (e.photos?.length > 0 || e.documents?.length > 0) && e.proofStatus !== "pending"
    );
    const proofScore = pastEvents.length > 0 ? eventsWithProofs.length / pastEvents.length : 0.5;

    // 5. Budget utilization
    const totalBudgetUsed = events.reduce((sum, e) => sum + (e.budgetUsed || 0), 0);
    const budgetAllocated = club.budgetAllocated || 100000;
    const budgetRatio = budgetAllocated > 0 ? totalBudgetUsed / budgetAllocated : 0;
    // Ideal is 60-90% usage
    const budgetScore = budgetRatio >= 0.6 && budgetRatio <= 0.9 ? 1 :
      budgetRatio < 0.6 ? budgetRatio / 0.6 : Math.max(0, 1 - (budgetRatio - 0.9) * 5);

    // 6. Attendance rate
    const attendedCount = await EventRegistration.countDocuments({
      event: { $in: eventIds },
      status: "attended",
    });
    const attendanceScore = totalRegs > 0 ? attendedCount / totalRegs : 0.5;

    // Weighted score
    const totalScore =
      eventScore * 0.2 +
      participationScore * 0.2 +
      feedbackScore * 0.25 +
      proofScore * 0.15 +
      budgetScore * 0.1 +
      attendanceScore * 0.1;

    // Determine status
    let status = "healthy";
    if (totalScore < 0.4) status = "critical";
    else if (totalScore < 0.65) status = "warning";

    // Rating (1-5)
    const rating = Math.round(totalScore * 5 * 10) / 10;

    await Club.findByIdAndUpdate(clubId, { status, rating });

    return { status, rating, totalScore };
  } catch (err) {
    console.error("recalculateClubHealth error:", err.message);
    return null;
  }
}

/**
 * Recalculate all clubs
 */
async function recalculateAllClubs() {
  const clubs = await Club.find();
  const results = [];
  for (const club of clubs) {
    const result = await recalculateClubHealth(club._id);
    results.push({ club: club.name, ...result });
  }
  return results;
}

module.exports = { recalculateClubHealth, recalculateAllClubs };
