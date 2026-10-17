import { z } from "zod";
import { TOURNAMENT_FORMAT } from "../tournaments/tournament.constants.js";
import { REGISTRATION_STATUS } from "./event.constants.js";

const objectId = (label) =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format`);

export const initializeEventTournamentsSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
  body: z
    .object({
      section: z.string().trim().optional(),
      brackets: z.array(z.string().trim()).optional(),
      sections: z
        .array(
          z.object({
            name: z.string().min(1).trim(),
            brackets: z.array(z.string().trim()).min(1),
            totalRounds: z.number().int().min(1).optional(),
            timeControl: z.union([z.string(), z.record(z.any())]).optional(),
            timeFormat: z.union([z.string(), z.record(z.any())]).optional(),
          }),
        )
        .optional(),
      timeControl: z.union([z.string(), z.record(z.any())]).optional(),
      timeFormat: z.union([z.string(), z.record(z.any())]).optional(),
      totalRounds: z.number().int().min(1).optional(),
      format: z
        .enum(Object.values(TOURNAMENT_FORMAT))
        .optional()
        .default(TOURNAMENT_FORMAT.SWISS),
      round1TopSeedColor: z.enum(["W", "B"]).optional().default("W"),
    })
    .optional()
    .default({}),
});

export const seedPlayersSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
  body: z
    .object({
      status: z
        .enum(Object.values(REGISTRATION_STATUS))
        .optional()
        .default(REGISTRATION_STATUS.CONFIRMED),
      autoAssignByRating: z.boolean().optional().default(false),
      ratingThresholds: z
        .object({
          beginnerMax: z.number().int().default(1200),
          intermediateMax: z.number().int().default(1600),
        })
        .optional(),
    })
    .optional()
    .default({}),
});

export const pairEventRoundSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
  }),
  body: z
    .object({
      section: z.string().trim().optional(),
      bracket: z.string().trim().optional(),
    })
    .optional()
    .default({}),
});

export const eventBracketParamSchema = z.object({
  params: z.object({
    id: objectId("Event ID"),
    section: z.string().trim(),
    bracket: z.string().trim(),
  }),
});
