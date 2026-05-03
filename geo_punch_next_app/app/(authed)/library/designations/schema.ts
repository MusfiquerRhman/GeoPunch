import { z } from "zod";

export const designationSchema = z.object({
    designation: z.string().min(1, "Designation is required"),
});