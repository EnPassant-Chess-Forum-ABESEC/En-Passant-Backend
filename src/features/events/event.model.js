import mongoose from "mongoose";
import { REGISTRATION_TYPE, EVENT_STATUS } from "./event.constants.js";

const teamConfigSchema = new mongoose.Schema(
  {
    minSize: { type: Number, default: 1 },
    maxSize: { type: Number, required: true },
  },
  { _id: false },
);

const bracketConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    minRating: { type: Number, default: null },
    maxRating: { type: Number, default: null },
    range: { type: String, default: "" },
    totalRounds: { type: Number, default: null },
  },
  { _id: false },
);

const sectionConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    brackets: [bracketConfigSchema],
  },
  { _id: false },
);

const prizeItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    place: { type: String, required: true },
    reward: { type: String, required: true },
  },
  { _id: false },
);

const prizesConfigSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Prizes & Accolades" },
    items: { type: [prizeItemSchema], default: [] },
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
    root: {
      type: String,
      default: "A C C",
    },
    format: {
      type: String,
      default: "Swiss System",
    },
    timeControl: {
      type: mongoose.Schema.Types.Mixed,
      default: "10 + 5",
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
    sections: {
      type: [sectionConfigSchema],
      default: [],
    },
    prizes: {
      type: prizesConfigSchema,
      default: () => ({ label: "Prizes & Accolades", items: [] }),
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
