import mongoose from "mongoose";
import {
  TOURNAMENT_FORMAT,
  TOURNAMENT_STATUS,
  ROUND_STATUS,
  GAME_RESULT,
  GAME_STATUS,
} from "./tournament.constants.js";

const tournamentPlayerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, default: 1200 },
    title: { type: String, default: "" },
    initialRank: { type: Number },
    active: { type: Boolean, default: true },
    halfPointByeRequestedRounds: { type: [Number], default: [] },
  },
  { _id: false },
);

const tournamentGameSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    round: { type: Number, required: true },
    boardNumber: { type: Number, required: true },
    whitePlayerId: { type: String, default: null },
    blackPlayerId: { type: String, default: null },
    result: {
      type: String,
      enum: [...Object.values(GAME_RESULT), null],
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(GAME_STATUS),
      default: GAME_STATUS.SCHEDULED,
    },
    pairingExplanation: { type: String, default: "" },
    manualOverride: { type: Boolean, default: false },
    arbiterNotes: { type: String, default: "" },
  },
  { _id: false },
);

const tournamentRoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(ROUND_STATUS),
      default: ROUND_STATUS.PUBLISHED,
    },
    isCompleted: { type: Boolean, default: false },
    games: [tournamentGameSchema],
    publishedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      default: null,
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
    format: {
      type: String,
      enum: Object.values(TOURNAMENT_FORMAT),
      default: TOURNAMENT_FORMAT.SWISS,
    },
    totalRounds: {
      type: Number,
      required: true,
      min: 1,
    },
    currentRoundNumber: {
      type: Number,
      default: 0,
    },
    round1TopSeedColor: {
      type: String,
      enum: ["W", "B"],
      default: "W",
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_STATUS),
      default: TOURNAMENT_STATUS.SETUP,
    },
    players: [tournamentPlayerSchema],
    rounds: [tournamentRoundSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

tournamentSchema.index({ status: 1 });
tournamentSchema.index({ referenceId: 1, section: 1, bracket: 1 });

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;
