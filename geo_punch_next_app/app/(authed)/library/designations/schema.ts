import { z } from "zod";

export const designationSchema = z.object({
    designation: z.string().trim().min(1, "Designation is required").max(50, "Designation must be at most 50 characters long"),
});
