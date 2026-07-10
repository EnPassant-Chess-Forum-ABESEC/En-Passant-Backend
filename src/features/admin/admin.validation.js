import { z } from "zod";
import { APPLICATION_STATUS } from "../recruitment/recruitment.constants.js";

export const getAllApplicationsSchema = z.object({
  query: z
    .object({
      status: z.enum(Object.values(APPLICATION_STATUS)).optional(),
      departmentId: z.string().optional(),
      year: z
        .string()
        .regex(/^\d{4}$/, "Invalid year format")
        .optional(),
    })
    .optional(),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Application ID format"),
  }),
  body: z.object({
    status: z.enum(Object.values(APPLICATION_STATUS), {
      errorMap: () => ({ message: "Invalid status provided" }),
    }),
  }),
});

export const getApplicationByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Application ID format"),
  }),
});
