import mongoose from "mongoose";

const EVENT_STATUS = ["upcoming", "ongoing", "completed", "cancelled"];

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
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    capacity: {
      type: Number,
      min: 0,
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    bannerUrl: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: EVENT_STATUS,
      default: "upcoming",
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

export { Event, EVENT_STATUS };
export default Event;
