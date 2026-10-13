import { z } from "zod";
import { TOURNAMENT_FORMAT, GAME_RESULT } from "./tournament.constants.js";

const objectId = (label) =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format`);

const playerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Player name is required").trim(),
  rating: z.number().int().min(0).optional().default(1200),
  title: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  halfPointByeRequestedRounds: z
    .array(z.number().int().min(1))
    .optional()
    .default([]),
});

export const createTournamentSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Tournament title is required").trim(),
    referenceId: z.string().optional(),
    section: z.string().trim().optional().default("open"),
    bracket: z.string().trim().optional().default("open"),
    format: z
      .enum(Object.values(TOURNAMENT_FORMAT))
      .optional()
      .default(TOURNAMENT_FORMAT.SWISS),
    totalRounds: z.number().int().min(1, "Total rounds must be at least 1"),
    round1TopSeedColor: z.enum(["W", "B"]).optional().default("W"),
    players: z.array(playerInputSchema).optional().default([]),
  }),
});

export const tournamentIdParamSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
  }),
});

export const addPlayersSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
  }),
  body: z.object({
    players: z.array(playerInputSchema).min(1, "At least one player required"),
  }),
});

export const updatePlayerSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
    playerId: z.string().min(1, "Player ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).trim().optional(),
    rating: z.number().int().min(0).optional(),
    title: z.string().optional(),
    active: z.boolean().optional(),
    halfPointByeRequestedRounds: z.array(z.number().int().min(1)).optional(),
  }),
});

export const updateGameResultSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
    roundNumber: z.coerce.number().int().min(1),
    gameId: z.string().min(1, "Game ID is required"),
  }),
  body: z.object({
    result: z.enum([...Object.values(GAME_RESULT), null]),
  }),
});

export const bulkUpdateGameResultsSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
    roundNumber: z.coerce.number().int().min(1),
  }),
  body: z.object({
    results: z
      .array(
        z.object({
          gameId: z.string().min(1),
          result: z.enum([...Object.values(GAME_RESULT), null]),
        }),
      )
      .min(1, "At least one game result required"),
  }),
});

export const roundParamsSchema = z.object({
  params: z.object({
    id: objectId("Tournament ID"),
    roundNumber: z.coerce.number().int().min(1),
  }),
});
