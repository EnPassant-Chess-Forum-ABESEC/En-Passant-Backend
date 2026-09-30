import { customAlphabet } from "nanoid";

export const REGISTRATION_TYPE = {
  SOLO: "solo",
  TEAM: "team",
};

export const EVENT_STATUS = {
  DRAFT: "draft",
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
};

export const REGISTRATION_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  DISQUALIFIED: "disqualified",
};

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export const generateJoinCode = () => nanoid();
