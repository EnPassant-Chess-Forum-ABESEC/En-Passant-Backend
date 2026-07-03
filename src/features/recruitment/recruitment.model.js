import mongoose from "mongoose";
import { APPLICATION_STATUS, PAYMENT_STATUS } from "./recruitment.constants.js";

const recruitmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.DRAFT,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    preferredDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    secondaryDepartmentId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
  },
  {
    timestamps: true,
  },
);

recruitmentSchema.index({ userId: 1, year: 1 }, { unique: true });
recruitmentSchema.index({ status: 1, paymentStatus: 1 });

const Recruitment = mongoose.model("Recruitment", recruitmentSchema);

export default Recruitment;
