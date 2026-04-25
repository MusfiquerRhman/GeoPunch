import { z } from "zod";

export const userSchema = z.object({
    id_card_no: z.string().min(1),
    name: z.string().min(1),
    department_id: z.string().min(1),
    designation_id: z.string().min(1),
    phone_no: z.string().min(1),
    is_active: z.boolean(),
    email: z.string(),
    password: z.string().min(6),
    isAdmin: z.boolean(),
});