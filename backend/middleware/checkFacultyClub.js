const checkFacultyClub = (req, res, next) => {
  try {
    const user = req.user;

    // If no assigned clubs, deny access
    if (!user || !user.assignedClubs || user.assignedClubs.length === 0) {
      return res.status(403).json({ message: "No club assigned" });
    }

    // Attach club IDs to request
    req.assignedClubIds = user.assignedClubs.map((c) =>
      c.toString()
    );

    next();
  } catch (error) {
    res.status(500).json({ message: "Faculty club check failed" });
  }
};

export default checkFacultyClub;