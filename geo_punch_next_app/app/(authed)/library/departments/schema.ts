import { z } from "zod";

export const departmentSchema = z.object({
    department_name: z.string().min(1, "Department name is required"),
});