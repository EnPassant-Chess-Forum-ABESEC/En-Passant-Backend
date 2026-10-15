import { z } from "zod";
import { EVENT_STATUS, REGISTRATION_TYPE } from "./event.constants.js";

const objectId = (label) =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format`);

const isoDate = (label) =>
  z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), `Invalid ${label}`)
    .transform((val) => new Date(val));

const teamConfigSchema = z.object({
  minSize: z.number().int().min(1).optional(),
  maxSize: z.number().int().min(1),
});

const bracketConfigSchema = z.object({
  name: z.string().min(1).trim().toLowerCase(),
  minRating: z.number().int().min(0).nullable().optional(),
  maxRating: z.number().int().min(0).nullable().optional(),
  range: z.string().optional(),
  totalRounds: z.number().int().min(1).nullable().optional(),
  timeControl: z.union([z.string(), z.record(z.any())]).optional(),
  timeFormat: z.union([z.string(), z.record(z.any())]).optional(),
});

const sectionConfigSchema = z.object({
  name: z.string().min(1).trim().toLowerCase(),
  title: z.string().optional(),
  description: z.string().optional(),
  timeControl: z.union([z.string(), z.record(z.any())]).optional(),
  timeFormat: z.union([z.string(), z.record(z.any())]).optional(),
  brackets: z.array(bracketConfigSchema).optional().default([]),
});

const prizeItemSchema = z.object({
  id: z.string().optional(),
  place: z.string().min(1),
  reward: z.string().min(1),
});

const prizesConfigSchema = z.object({
  label: z.string().optional().default("Prizes & Accolades"),
  items: z.array(prizeItemSchema).optional().default([]),
});

const eventBody = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().min(1, "Description is required"),
  root: z.string().optional(),
  format: z.string().optional(),
  timeControl: z.union([z.string(), z.record(z.any())]).optional(),
  bannerUrl: z.string().url("Invalid bannerUrl"),
  startDate: isoDate("startDate"),
  endDate: isoDate("endDate"),
  registrationDeadline: isoDate("registrationDeadline"),
  participationMode: z.enum(Object.values(REGISTRATION_TYPE)),
  status: z.enum(Object.values(EVENT_STATUS)),
  sections: z.array(sectionConfigSchema).optional().default([]),
  prizes: prizesConfigSchema.optional(),
  teamConfig: teamConfigSchema,
});

export const createEventSchema = z.object({
  body: eventBody
    .partial({ bannerUrl: true, status: true, teamConfig: true, root: true, format: true, timeControl: true, prizes: true })
    .refine(
      (data) => data.participationMode !== REGISTRATION_TYPE.TEAM || data.teamConfig,
      { message: "teamConfig is required for team events", path: ["teamConfig"] },
    ),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
  body: eventBody.partial(),
});

export const getEventByIdSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
});

export const deleteEventSchema = getEventByIdSchema;