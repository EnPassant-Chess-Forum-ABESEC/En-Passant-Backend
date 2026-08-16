import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["UNREAD", "READ", "RESOLVED"],
      default: "UNREAD",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContactQuery", contactSchema);
