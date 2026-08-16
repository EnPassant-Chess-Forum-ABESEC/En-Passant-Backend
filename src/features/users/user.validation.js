import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    branch: z.string().min(2, "Branch name is too short").optional(),
    year: z.number().int().min(1).max(5).optional(),
    collegeEmail: z.string()
      .email("Invalid email format")
      .refine(email => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email), {
        message: "Invalid email format"
      })
      .refine(email => email.endsWith("@abes.ac.in"), {
        message: "College email must end with @abes.ac.in"
      })
      .optional(),
    phoneNumber: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(/^\+91/, "").replace(/[\s-]/g, "") : val),
      z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only numbers")
        .optional()
    ),
    phoneNo: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(/^\+91/, "").replace(/[\s-]/g, "") : val),
      z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only numbers")
        .optional()
    ),
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
  }).transform(data => {
    if (data.phoneNo !== undefined && data.phoneNumber === undefined) {
      data.phoneNumber = data.phoneNo;
    }
    delete data.phoneNo;
    return data;
  }),
});

export const onboardingSchema = z.object({
  body: z.object({
    branch: z.string().min(2, "Branch name is required"),
    year: z.number().int().min(1).max(5),
    collegeEmail: z.string()
      .email("Invalid email format")
      .refine(email => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email), {
        message: "Invalid email format"
      })
      .refine(email => email.endsWith("@abes.ac.in"), {
        message: "College email must end with @abes.ac.in"
      }),
    phoneNumber: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(/^\+91/, "").replace(/[\s-]/g, "") : val),
      z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only numbers")
    ),
    phoneNo: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(/^\+91/, "").replace(/[\s-]/g, "") : val),
      z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only numbers")
        .optional()
    ),
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
  }).transform(data => {
    if (data.phoneNo !== undefined && data.phoneNumber === undefined) {
      data.phoneNumber = data.phoneNo;
    }
    delete data.phoneNo;
    return data;
  }),
});
