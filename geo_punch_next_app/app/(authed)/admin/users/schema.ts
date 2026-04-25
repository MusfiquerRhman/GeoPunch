import { z } from "zod";

export const userSchema = z.object({
    id_card_no: z.string().min(1, "Id Card No is required"),
    name: z.string().min(1, "Name is required"),
    department_id: z.string().optional(),
    designation_id: z.string().optional(),
    phone_no: z.string().min(1, "Phone No is required"),
    isActive: z.boolean(),
    email: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    isAdmin: z.boolean(),
});