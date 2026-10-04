import { z } from "zod";

export const userSchema = z.object({
    id_card_no: z.string().min(1, "Id Card No is required"),
    name: z.string().min(1, "Name is required"),
    department_id: z.string().optional(),
    designation_id: z.string().optional(),
    company_id: z.string().optional(),
    phone_no: z.string().min(1, "Phone No is required"),
    isActive: z.boolean(),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    isAdmin: z.boolean(),
});

export const editUserSchema = userSchema.extend({
    password: z.string().refine((password) => password.length === 0 || password.length >= 8, {
        message: "A new password must be at least 8 characters long",
    }),
});
