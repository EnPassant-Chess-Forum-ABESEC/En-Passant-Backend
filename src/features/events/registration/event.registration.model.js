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
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
    },
  },
  { timestamps: true },
);

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
