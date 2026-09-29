import { z } from "zod";

export const registerForEventValidation = z.object({
  body: z.object({
    participation: z.discriminatedUnion("participationType", [
      z.object({
        participationType: z.literal("team"),
        teamName: z.string().min(1, "Team name is required"),
      }),
      z.object({
        participationType: z.literal("solo"),
        teamName: z.string().optional(),
      }),
    ]),
  }),
});

export const joinTeamValidation = z.object({
  body: z.object({
    joinCode: z.string().length(4, "Join code must be exactly 4 characters"),
  }),
});
