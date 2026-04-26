import { email, z } from "zod";

export const loginSchema = z.object({
    id_card_no: z.string().min(1, "Id Card No is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});
