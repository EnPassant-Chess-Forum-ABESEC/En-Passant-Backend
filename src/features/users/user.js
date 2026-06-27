import mongoose from "mongoose";

// Chess account sub schema
const chessAccountsSchema = new mongoose.Schema(
  {
    chessCom: {
      username: { type: String, trim: true },
      ratings: {
        blitz: { type: Number, default: 0 },
        bullet: { type: Number, default: 0 },
        rapid: { type: Number, default: 0 },
      },
    },
    lichess: {
      username: { type: String, trim: true },
      ratings: {
        blitz: { type: Number, default: 0 },
        bullet: { type: Number, default: 0 },
        rapid: { type: Number, default: 0 },
      },
    },
    lastSync: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Main user schema
const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    collegeEmail: {
      type: String,
      required: true,
      unique: true,
    },
    branch: {
      type: String,
      default: null,
      trim: true,
    },
    year: { type: Number, min: 1, max: 5, default: 1 },
    chessAccounts: { type: chessAccountsSchema, default: {} },
    profilePictureUrl: {
      type: String,
      default: " ",
      trim: true,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
