import Club from "../models/Club.js";

export const recalculateClubHealth = async (clubId) => {
  try {
    const club = await Club.findById(clubId);

    if (!club) return;

    // -----------------------------
    // SAFE DEFAULTS
    // -----------------------------
    const eventCount = club.eventCount || 0;
    const participationRate = club.participationRate || 0;
    const attendanceRate = club.attendanceRate || 0;
    const proofSubmissionRate = club.proofSubmissionRate || 0;
    const membersCount = club.membersCount || club.members.length || 0;

    const budgetAllocated = club.budgetAllocated || 0;
    const budgetUsed = club.budgetUsed || 0;

    // -----------------------------
    // CALCULATE SCORE
    // -----------------------------
    let score = 0;

    // EVENTS (max ~40)
    score += Math.min(eventCount * 10, 40);

    // PARTICIPATION (max ~30)
    score += participationRate * 0.3;

    // ATTENDANCE (max ~20)
    score += attendanceRate * 0.2;

    // PROOF (max ~30)
    score += proofSubmissionRate * 0.3;

    // BUDGET (max ~20)
    if (budgetAllocated > 0) {
      const efficiency = (budgetUsed / budgetAllocated) * 100;
      score += efficiency * 0.2;
    }

    // MEMBERS BONUS (encourage growth)
    if (membersCount >= 50) score += 10;
    else if (membersCount >= 20) score += 5;

    // -----------------------------
    // NORMALIZE
    // -----------------------------
    score = Math.min(100, Math.round(score));

    // -----------------------------
    // STATUS
    // -----------------------------
    let status = "critical";

    if (score >= 70) status = "healthy";
    else if (score >= 40) status = "warning";

    // -----------------------------
    // SAVE
    // -----------------------------
    club.healthScore = score;
    club.healthStatus = status;

    await club.save();

    console.log("Updated:", club.name, "Score:", score, "Status:", status);

    return club;
  } catch (err) {
    console.error("Health calc error:", err.message);
  }
};