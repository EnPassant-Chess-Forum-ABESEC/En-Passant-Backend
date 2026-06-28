import mongoose from "mongoose";

const ratingsSchema = new mongoose.Schema(
  {
    blitz: { type: Number, default: 0 },
    bullet: { type: Number, default: 0 },
    rapid: { type: Number, default: 0 },
  },
  { _id: false },
);

const chessAccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    ratings: {
      type: ratingsSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
    },

    lastSync: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const chessAccountsSchema = new mongoose.Schema(
  {
    chessCom: {
      type: chessAccountSchema,
      default: undefined,
    },

    lichess: {
      type: chessAccountSchema,
      default: undefined,
    },
  },
  { _id: false },
);

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
      trim: true,
    },

    collegeEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    branch: {
      type: String,
      default: null,
      trim: true,
    },

    year: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },

    chessAccounts: {
      type: chessAccountsSchema,
      default: () => ({}),
    },

    profilePictureUrl: {
      type: String,
      default: null,
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
