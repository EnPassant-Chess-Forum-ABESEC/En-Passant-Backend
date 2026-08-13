import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    branch: z.string().min(2, "Branch name is too short").optional(),
    year: z.number().int().min(1).max(5).optional(),
    collegeEmail: z.string()
      .email("Invalid email format")
      .refine(email => email === "" || email.endsWith("@abes.ac.in"), {
        message: "College email must end with @abes.ac.in"
      })
      .optional()
      .or(z.literal("")),
    phoneNumber: z.string()
      .length(10, "Phone number must be exactly 10 digits")
      .regex(/^\d+$/, "Phone number must contain only numbers")
      .optional()
      .or(z.literal("")),
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
    collegeEmail: z.string()
      .email("Invalid email format")
      .refine(email => email === "" || email.endsWith("@abes.ac.in"), {
        message: "College email must end with @abes.ac.in"
      })
      .optional()
      .or(z.literal("")),
    phoneNumber: z.string()
      .length(10, "Phone number must be exactly 10 digits")
      .regex(/^\d+$/, "Phone number must contain only numbers")
      .optional()
      .or(z.literal("")),
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
