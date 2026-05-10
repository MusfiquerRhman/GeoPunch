import { z } from "zod";

export const officeSchema = z.object({
    db_id: z.string().optional(),
    name: z.string().min(1, "Office name is required"),
    company_id: z.string().min(1, "Company ID is required"),
});