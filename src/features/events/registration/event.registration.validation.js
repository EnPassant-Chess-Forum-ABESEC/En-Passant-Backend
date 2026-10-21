import { z } from "zod";

export const registerForEventValidation = z.object({
  body: z.object({
    section: z.string().trim().optional().default("open"),
    bracket: z.string().trim().optional().default("open"),
    gender: z.preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase().trim() : val),
      z.enum(["male", "female"], {
        errorMap: () => ({ message: "Gender is required (male or female)" }),
      }),
    ),
    isHosteler: z.preprocess(
      (val) => val === true || val === "true",
      z.boolean().default(false),
    ),
    utr: z.string().trim().optional(),
    teamName: z.string().trim().optional(),
    clubName: z.string().trim().optional(),
    participation: z
      .preprocess(
        (val) => {
          if (typeof val === "string") {
            try {
              return JSON.parse(val);
            } catch {
              return val;
            }
          }
          return val;
        },
        z.discriminatedUnion("participationType", [
          z.object({
            participationType: z.literal("team"),
            teamName: z.string().min(1, "Team name is required"),
            clubName: z.string().optional(),
          }),
          z.object({
            participationType: z.literal("solo"),
            teamName: z.string().optional(),
            clubName: z.string().optional(),
          }),
        ]),
      )
      .optional()
      .default({ participationType: "solo" }),
  }),
});

export const joinCodeValidation = z.object({
  body: z.object({
    joinCode: z.string().length(6, "Join code must be exactly 6 characters"),
  }),
});
