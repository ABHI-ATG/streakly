const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🔧 Updated to match your schema: status[].activity[].name + completed
const matchActivity = (activities, status) => {
  const today = new Date().toISOString().split("T")[0];

  let currentDateStatus = status.find((s) => s.date === today);

  if (!currentDateStatus) {
    currentDateStatus = {
      date: today,
      activity: activities.map((name) => ({
        name,
        completed: false,
      })),
    };
    status.push(currentDateStatus);
    return;
  }

  // Remove any activity not in the current user activity list
  currentDateStatus.activity = currentDateStatus.activity.filter((a) =>
    activities.includes(a.name)
  );

  // Add missing ones
  const existingNames = currentDateStatus.activity.map((a) => a.name);
  activities.forEach((act) => {
    if (!existingNames.includes(act)) {
      currentDateStatus.activity.push({ name: act, completed: false });
    }
  });
};

// 🟩 Create user or return existing with synced activities
router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    let user = await User.findOne({ name });

    if (user) {
      matchActivity(user.activities, user.status);
      await user.save(); // 🔧 ensure updated match is saved
      return res.status(200).json({ data: user });
    }

    user = new User({ name, activities: [], status: [] });
    await user.save();
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟩 Replace activities array and sync today's status
router.post("/addActivities", async (req, res) => {
  try {
    const { name, activities } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.activities = activities;
    matchActivity(activities, user.status);
    await user.save(); // 🔧 save after syncing
    res.send("Activities updated successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟩 Mark activity as completed for today
router.post("/complete", async (req, res) => {
  try {
    const { name, activity } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    let todayStatus = user.status.find((s) => s.date === today);

    // 🔧 ensure today's status exists (safety net)
    if (!todayStatus) {
      matchActivity(user.activities, user.status);
      todayStatus = user.status.find((s) => s.date === today);
    }

    const activityEntry = todayStatus.activity.find((a) => a.name === activity);
    if (!activityEntry) {
      return res.status(404).json({ error: "Activity not found for today" });
    }

    activityEntry.completed = !activityEntry.completed; 
    await user.save();

    res.send("Activity marked as completed");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
