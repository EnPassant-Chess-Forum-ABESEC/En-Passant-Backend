import { z } from "zod";
import { EVENT_STATUS } from "./event.model.js";

const objectId = (label) =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format`);

const isoDate = (label) =>
  z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), `Invalid ${label}`)
    .transform((val) => new Date(val));

export const createEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, "Title is required").trim(),
      description: z.string().min(1, "Description is required"),
      date: isoDate("date"),
      venue: z.string().min(1, "Venue is required").trim(),
      registrationDeadline: isoDate("registrationDeadline").optional(),
      capacity: z.number().int().min(0).optional(),
      isPaid: z.boolean().optional(),
      amount: z.number().min(0).optional(),
      bannerUrl: z.string().url("Invalid bannerUrl").optional(),
      status: z.enum(EVENT_STATUS).optional(),
    })
    .refine(
      (data) => !data.isPaid || (data.amount !== undefined && data.amount > 0),
      {
        message: "amount (>0) is required when isPaid is true",
        path: ["amount"],
      },
    ),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
  body: z
    .object({
      title: z.string().min(1, "Title is required").trim().optional(),
      description: z.string().min(1, "Description is required").optional(),
      date: isoDate("date").optional(),
      venue: z.string().min(1, "Venue is required").trim().optional(),
      registrationDeadline: isoDate("registrationDeadline").optional(),
      capacity: z.number().int().min(0).optional(),
      isPaid: z.boolean().optional(),
      amount: z.number().min(0).optional(),
      bannerUrl: z.string().url("Invalid bannerUrl").optional(),
      status: z.enum(EVENT_STATUS).optional(),
    })
    .refine(
      (data) => !data.isPaid || (data.amount === undefined ? true : data.amount > 0),
      {
        message: "amount must be greater than 0 when isPaid is true",
        path: ["amount"],
      },
    ),
});

export const getEventByIdSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
});

export const deleteEventSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
});

export const getAllEventsSchema = z.object({
  query: z
    .object({
      status: z.enum(EVENT_STATUS).optional(),
      upcomingOnly: z
        .enum(["true", "false"])
        .optional()
        .transform((val) => val === "true"),
      pageSize: z.coerce.number().int().min(1).optional(),
      pageNumber: z.coerce.number().int().min(1).optional(),
    })
    .optional(),
});
