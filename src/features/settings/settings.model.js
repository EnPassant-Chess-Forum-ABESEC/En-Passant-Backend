import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    applicationStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    applicationEndDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    taskRevealDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submissionEndDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
