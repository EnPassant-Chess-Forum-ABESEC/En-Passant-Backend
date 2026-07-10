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

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    code: z.string().min(1, "Code is required").trim(),
    description: z.string().optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z
    .object({
      departmentId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid Department ID format"),
      year: z.number().int(),
      title: z.string().min(1, "Title is required").trim(),
      summary: z.string().min(1, "Summary is required"),
      instructions: z
        .array(z.string().trim().min(1, "Instruction cannot be empty"))
        .min(1, "Instructions are required"),
      order: z.number().int().min(1),
      isRequired: z.boolean().optional(),
      submission: z
        .object({
          acceptsText: z.boolean().optional(),
          acceptsLinks: z.boolean().optional(),
          acceptsFiles: z.boolean().optional(),
          fileCategory: z.enum(["image", "video", "raw"]).optional(),
          maxFiles: z.number().int().optional(),
          maxFileSize: z.number().int().optional(),
        })
        .optional(),
    })
    .refine(
      (data) => {
        if (data.submission?.acceptsFiles) {
          const { fileCategory, maxFiles, maxFileSize } = data.submission;
          return (
            fileCategory !== undefined &&
            maxFiles !== undefined &&
            maxFiles > 0 &&
            maxFileSize !== undefined &&
            maxFileSize > 0
          );
        }
        return true;
      },
      {
        message:
          "If acceptsFiles is true, fileCategory, maxFiles (>0), and maxFileSize (>0) must be provided in submission object",
        path: ["submission", "acceptsFiles"],
      },
    ),
});
