import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    branch: z.string().min(2, "Branch name is too short").optional(),
    year: z.number().int().min(1).max(5).optional(),
    chessAccounts: z
      .object({
        chessCom: z
          .object({
            username: z.string().min(1, "Chess.com username is required"),
          })
          .optional(),
        lichess: z
          .object({
            username: z.string().min(1, "Lichess username is required"),
          })
          .optional(),
      })
      .optional(),
  }),
});

export const onboardingSchema = z.object({
  body: z.object({
    branch: z.string().min(2, "Branch name is required"),
    year: z.number().int().min(1).max(5),
    chessAccounts: z
      .object({
        chessCom: z
          .object({
            username: z.string().min(1, "Chess.com username is required"),
          })
          .optional(),
        lichess: z
          .object({
            username: z.string().min(1, "Lichess username is required"),
          })
          .optional(),
      })
      .optional(),
  }),
});
