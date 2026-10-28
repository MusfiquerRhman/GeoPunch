"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { editUserSchema, userSchema } from "@/app/(authed)/admin/users/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageLoading from "@/components/UI/PageLoading";
import { employeeFormValues, type EditUserValues, type EmployeeDetails } from "@/app/(authed)/admin/users/form-utils";
import { requestJson, fetchAllOptions } from "@/utils/adminForms";

type Department = { id: string; department_name: string };
type Designation = { id: string; designations: string };
type Company = { id: string; name: string };

const emptyValues: EditUserValues = {
    id_card_no: "", name: "", email: "", phone_no: "", password: "",
    department_id: "", designation_id: "", company_id: "",
    isActive: true, isAdmin: false,
};

export default function UserForm({ id }: { id?: string }) {
    const form = useForm<EditUserValues>({
        resolver: zodResolver(id ? editUserSchema : userSchema),
        defaultValues: emptyValues,
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;

    useEffect(() => {   
        const controller = new AbortController();
        const fetchEmployee = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const employeeRequest = id ? requestJson<EmployeeDetails>(`/api/users/${id}`, { signal: controller.signal }) : Promise.resolve(null);
                const [employee, departmentOptions, designationOptions, companyOptions] = await Promise.all([
                    employeeRequest,
                    fetchAllOptions<Department>("/api/library/department", "departments", controller.signal),
                    fetchAllOptions<Designation>("/api/library/designation", "designations", controller.signal),
                    fetchAllOptions<Company>("/api/library/company", "companies", controller.signal),
                ]);
                if (controller.signal.aborted) return;

                setDepartments(departmentOptions);
                setDesignations(designationOptions);
                setCompanies(companyOptions);
                reset(employee ? employeeFormValues(employee) : emptyValues);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Error fetching user:", error);
                setLoadError(true);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchEmployee();
        return () => controller.abort();
    }, [id, reset]);

    const onSubmit = async (data: EditUserValues) => {
        setMessage("");
        setErrorMessage("");
        try {
            const options = {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            };
            if (id) {
                const result = await requestJson<EmployeeDetails>(`/api/users/${id}`, options);
                reset(employeeFormValues(result));
            } else {
                await requestJson("/api/users", options);
                reset(emptyValues);
            }
            const message = `User ${id ? "updated" : "created"} successfully`;
            setMessage(message);
            toast.success(message);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not update this user. Please try again.";
            setErrorMessage(message);
            toast.error(message);
        }
    };

    return (
        <Wrapper heading="User Management" scrollable>
            {message && <p role="status" className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p role="alert" className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            {isLoading ? <PageLoading /> : loadError ? (
                <p className="max-w-[550px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load this user or the available departments, designations, and companies. Please reload and try again.</p>
            ) : <form onSubmit={handleSubmit(onSubmit, () => {
                    setMessage("");
                    setErrorMessage("Please correct the highlighted fields before saving.");
                })}
                className="form-panel flex max-w-[700px] flex-row flex-wrap gap-4"
            >
                <fieldset disabled={isSubmitting} className="contents">
                <FormField
                    label="Id Card No"
                    name="id_card_no"
                    placeholder="Id Card No"
                    register={register}
                    errors={form.formState.errors.id_card_no}
                />
                <FormField
                    label="Name"
                    name="name"
                    placeholder="Name"
                    register={register}
                    errors={form.formState.errors.name}
                />
                <FormField
                    label="Phone No"
                    name="phone_no"
                    placeholder="Phone Number"
                    register={register}
                    errors={form.formState.errors.phone_no}
                />
                <FormField
                    label="Email"
                    name="email"
                    placeholder="Email"
                    register={register}
                    errors={form.formState.errors.email}
                />
                <FormField
                    label={id ? "New Password" : "Password"}
                    name="password"
                    placeholder={id ? "Leave blank to keep current password" : "Enter a password of at least 8 characters"}
                    type="password"
                    autoComplete="new-password"
                    register={register}
                    errors={form.formState.errors.password}
                />
                <div className="flex w-full flex-col gap-1.5">
                    <label htmlFor="department_id" className="text-sm font-medium text-gray-700">Department</label>
                    <select id="department_id" {...register("department_id")}
                        aria-invalid={!!errors.department_id}
                        className="form-select flex-3"
                    >
                        <option value="">No Department</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.department_name}
                            </option>
                        ))}
                    </select>
                    {errors.department_id && <p className="text-sm text-red-600">{errors.department_id.message}</p>}
                </div>
                <div className="flex w-full flex-col gap-1.5">
                    <label htmlFor="designation_id" className="text-sm font-medium text-gray-700">Designation</label>
                    <select id="designation_id" {...register("designation_id")}
                        aria-invalid={!!errors.designation_id}
                        className="form-select flex-3"
                    >
                        <option value="">No Designation</option>
                        {designations.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.designations}
                            </option>
                        ))}
                    </select>
                    {errors.designation_id && <p className="text-sm text-red-600">{errors.designation_id.message}</p>}
                </div>
                <div className="flex w-full flex-col gap-1.5">
                    <label htmlFor="company_id" className="text-sm font-medium text-gray-700">Company</label>
                    <select id="company_id" {...register("company_id")}
                        aria-invalid={!!errors.company_id}
                        className="form-select flex-3"
                    >
                        <option value="">No Company</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {errors.company_id && <p className="text-sm text-red-600">{errors.company_id.message}</p>}
                </div>
               <div className="flex w-full gap-4 items-center">
                    <label htmlFor="isActive" className="m-1 w-1/5 text-sm font-medium text-gray-700">Active</label>
                    <input
                        id="isActive"
                        type='checkbox'
                        className="h-5 w-5 rounded border-gray-300 accent-teal-700 focus:ring-2 focus:ring-teal-100"
                        {...register("isActive")}
                    />
                </div>
                <div className="flex w-full gap-4 items-center">
                    <label htmlFor="isAdmin" className="m-1 w-1/5 text-sm font-medium text-gray-700">Admin</label>
                    <input
                        id="isAdmin"
                        type='checkbox'
                        className="h-5 w-5 rounded border-gray-300 accent-teal-700 focus:ring-2 focus:ring-teal-100"
                        {...register("isAdmin")}
                    />
                </div>
                <button type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60"
                >
                    {isSubmitting ? "Saving…" : id ? "Save Changes" : "Create User"}
                </button>
                </fieldset>
            </form>}
        </Wrapper>
    );
}
