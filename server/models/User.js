const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema({
  date: { type: String, required: true },
  activity: [
    {
      name: { type: String, required: true },
      completed: { type: Boolean, default: false },
    },
  ],
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  activities: [{ type: String }],
  status: [StatusSchema],
});

module.exports = mongoose.model("User", UserSchema);
