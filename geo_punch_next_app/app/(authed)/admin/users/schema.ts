import { z } from "zod";

export const userSchema = z.object({
    id_card_no: z.string().trim().min(1, "Id Card No is required").max(50, "Id Card No must be at most 50 characters long"),
    name: z.string().trim().min(1, "Name is required").max(75, "Name must be at most 75 characters long"),
    department_id: z.uuid("Select a valid department").or(z.literal("")).nullish(),
    designation_id: z.uuid("Select a valid designation").or(z.literal("")).nullish(),
    company_id: z.uuid("Select a valid company").or(z.literal("")).nullish(),
    phone_no: z.string().trim().min(1, "Phone No is required").max(20, "Phone No must be at most 20 characters long"),
    isActive: z.boolean(),
    email: z.string().trim().pipe(z.email("Invalid email address").max(50, "Email must be at most 50 characters long")),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    isAdmin: z.boolean(),
});

export const editUserSchema = userSchema.extend({
    password: z.string().refine((password) => password.length === 0 || password.length >= 8, {
        message: "A new password must be at least 8 characters long",
    }),
});
