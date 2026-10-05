"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { editUserSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import PageLoading from "@/components/UI/PageLoading";

type EmployeeDetailsPageProps = {
    params: Promise<{ id: string }>
};

export default function NewUsers({ params }: EmployeeDetailsPageProps){
    const { id } = use(params);

    const form = useForm({
        resolver: zodResolver(editUserSchema),
        defaultValues: { password: "" },
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/users/${id}`);
                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setValue("id_card_no", data.id_card_no);
                setValue("name", data.name);
                setValue("email", data.email);
                setValue("department_id", data.department_id);
                setValue("designation_id", data.designation_id);
                setValue("company_id", data.company_id);
                setValue("phone_no", data.phone_no);
                setValue("isActive", data.is_active);
                setValue("isAdmin", data.is_admin);
            } catch (error) {
                console.error("Error fetching user:", error);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployee();
    }, [id, setValue]);

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetch("/api/library/department").then((res) => res.json()).then((data) => {
        setDepartments(data.departments);
        })
        .catch((err) => console.error(err));
    }, []);

    const [designations, setDesignations] = useState([]);

    useEffect(() => {
        fetch("/api/library/designation").then((res) => res.json()).then((data) => {
            setDesignations(data.designations);
        })
        .catch((err) => console.error(err));
    }, []);

    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        fetch("/api/library/company").then((res) => res.json()).then((data) => {
            setCompanies(data.companies);
        })
        .catch((err) => console.error(err));
    }, []);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch(`/api/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        
        const res = await response.json(); 
        console.log("Response from server:", res, response );


        if (!response.ok) {
            toast.error(res.message || "An error occurred while creating the office");
            setErrorMessage(res.message);
            setMessage("");
            return;
        }

        setMessage("User updated successfully");
        toast.success("User updated successfully");
    };

    return (
        <Wrapper heading="User Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            {isLoading ? <PageLoading /> : loadError ? (
                <p className="max-w-[550px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load this user. Please go back and try again.</p>
            ) : <form onSubmit={handleSubmit(onSubmit)}
                className="form-panel flex max-w-[700px] flex-row flex-wrap gap-4"
            >
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
                    label="Password"
                    name="password"
                    placeholder="Leave blank to keep current password"
                    type="password"
                    register={register}
                    errors={form.formState.errors.password}
                />
                <div className="flex w-full">
                    <label className="flex-1 text-sm font-medium text-gray-700">Department ID</label>
                    <select defaultValue={''} {...register("department_id")} 
                        className="form-select flex-3"
                    >
                        <option disabled value="">Select Department</option>
                        {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>
                                {d.department_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-full">
                    <label className="flex-1 text-sm font-medium text-gray-700">Designation ID</label>
                    <select defaultValue={''} {...register("designation_id")} 
                        className="form-select flex-3"
                    >
                        <option disabled value="">Select Designation</option>
                        {(designations ?? []).map((d: any) => (
                            <option key={d.id} value={d.id}>
                                {d.designations}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-full">
                    <label className="flex-1 text-sm font-medium text-gray-700">Company ID</label>
                    <select defaultValue={''} {...register("company_id")} 
                        className="form-select flex-3"
                    >
                        <option disabled value="">Select Company</option>
                        {(companies ?? []).map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
               <div className="flex w-full gap-4 items-center">
                    <label className="m-1 w-1/5 text-sm font-medium text-gray-700">Active</label>
                    <input
                        type='checkbox'
                        className="h-5 w-5 rounded border-gray-300 accent-teal-700 focus:ring-2 focus:ring-teal-100"
                        {...register("isActive", { setValueAs: (v) => v === true || v === "on", })}
                    />
                </div>
                <div className="flex w-full gap-4 items-center">
                    <label className="m-1 w-1/5 text-sm font-medium text-gray-700">Admin</label>
                    <input
                        type='checkbox'
                        className="h-5 w-5 rounded border-gray-300 accent-teal-700 focus:ring-2 focus:ring-teal-100"
                        {...register("isAdmin", { setValueAs: (v) => v === true || v === "on", })}
                    />
                </div>
                <button type="submit"
                    className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                    Submit
                </button>
            </form>}
        </Wrapper>
    );
}
