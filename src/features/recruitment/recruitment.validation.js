import { z } from "zod";

export const createApplicationSchema = z.object({
  body: z.object({
    preferredDepartmentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid preferred department id")
      .min(1, "Preferred department id is required"),
    secondaryDepartmentId: z
      .array(
        z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid secondary department id"),
      )
      .optional(),
  }),
});
