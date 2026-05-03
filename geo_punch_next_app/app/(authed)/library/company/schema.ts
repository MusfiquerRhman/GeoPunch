import { z } from "zod";

export const companySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters long").max(100, "Company name must be less than 100 characters long"),
});