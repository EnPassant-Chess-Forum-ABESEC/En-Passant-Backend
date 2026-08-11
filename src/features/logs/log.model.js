import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["INFO", "ERROR", "WARN"],
      default: "INFO",
    },
    source: {
      type: String,
      default: "worker",
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      expires: 604800,
    },
  },
  {
    timestamps: true,
  },
);

export const Log = mongoose.model("Log", logSchema);
