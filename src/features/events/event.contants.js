import { nanoid } from "nanoid";

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

export const generateJoinCode = () => nanoid(8);
