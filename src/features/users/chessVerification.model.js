import mongoose from "mongoose";

const chessVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const ChessVerification = mongoose.model("ChessVerification", chessVerificationSchema);

export default ChessVerification;
