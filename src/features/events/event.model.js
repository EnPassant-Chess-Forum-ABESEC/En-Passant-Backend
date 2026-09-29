import mongoose from "mongoose";
import { REGISTRATION_TYPE, EVENT_STATUS } from "./event.constants.js";

const teamConfigSchema = new mongoose.Schema(
  {
    minSize: { type: Number, default: 1 },
    maxSize: { type: Number, required: true },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    bannerUrl: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    participationMode: {
      type: String,
      enum: Object.values(REGISTRATION_TYPE),
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },
    teamConfig: {
      type: teamConfigSchema,
      required: function () {
        return this.participationMode === "team";
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
