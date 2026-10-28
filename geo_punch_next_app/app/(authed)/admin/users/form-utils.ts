import type { z } from "zod";
import type { editUserSchema } from "./schema";

export type EditUserValues = z.infer<typeof editUserSchema>;

export type EmployeeDetails = {
    id: string;
    id_card_no: string | null;
    name: string;
    email: string | null;
    phone_no: string | null;
    department_id: string | null;
    designation_id: string | null;
    company_id: string | null;
    is_active: boolean | null;
    is_admin: boolean | null;
};

export function employeeFormValues(employee: EmployeeDetails): EditUserValues {
    return {
        id_card_no: employee.id_card_no ?? "",
        name: employee.name,
        email: employee.email ?? "",
        phone_no: employee.phone_no ?? "",
        department_id: employee.department_id ?? "",
        designation_id: employee.designation_id ?? "",
        company_id: employee.company_id ?? "",
        isActive: employee.is_active === true,
        isAdmin: employee.is_admin === true,
        password: "",
    };
}

