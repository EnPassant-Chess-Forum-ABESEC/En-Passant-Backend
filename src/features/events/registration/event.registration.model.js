import mongoose from "mongoose";
import {
  REGISTRATION_TYPE,
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
} from "../event.constants.js";

const teamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    joinCode: {
      type: String,
      required: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [teamMemberSchema],
  },
  { _id: false },
);

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationType: {
      type: String,
      enum: Object.values(REGISTRATION_TYPE),
    },
    team: {
      type: teamSchema,
      required: function () {
        return this.registrationType === "team";
      },
    },
    teamName: {
      type: String,
      default: null,
      trim: true,
    },
    clubName: {
      type: String,
      default: null,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    section: {
      type: String,
      default: "open",
      trim: true,
      lowercase: true,
    },
    bracket: {
      type: String,
      default: "open",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
    },
    isHosteler: {
      type: Boolean,
      default: false,
    },
    residentType: {
      type: String,
      enum: ["hosteler", "day_scholar", null],
      default: null,
    },
    peakRapidRating: {
      type: Number,
      default: null,
    },
    rapidGamesCount: {
      type: Number,
      default: null,
    },
    chessUsername: {
      type: String,
      default: null,
      trim: true,
    },
    utr: {
      type: String,
      default: null,
      trim: true,
    },
    paymentScreenshotUrl: {
      type: String,
      default: null,
    },
    paymentScreenshotPublicId: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

eventRegistrationSchema.index({ eventId: 1, section: 1, bracket: 1, status: 1 });

eventRegistrationSchema.index(
  { eventId: 1, "team.teamName": 1 },
  { unique: true, partialFilterExpression: { "team.teamName": { $type: "string" } } }
);

eventRegistrationSchema.index(
  { eventId: 1, "team.joinCode": 1 },
  { unique: true, partialFilterExpression: { "team.joinCode": { $type: "string" } } }
);

export const EventRegistration = mongoose.model(
  "EventRegistration",
  eventRegistrationSchema,
);
