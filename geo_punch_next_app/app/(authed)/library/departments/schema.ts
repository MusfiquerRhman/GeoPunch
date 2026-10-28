import { z } from "zod";

export const departmentSchema = z.object({
    department_name: z.string().trim().min(1, "Department name is required").max(50, "Department name must be at most 50 characters long"),
});
