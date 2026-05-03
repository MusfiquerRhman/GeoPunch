"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { departmentSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

type DepartmentDetailsPageProps = {
    params: Promise<{ id: string }>
};


export default function Edit({ params }: DepartmentDetailsPageProps) {
    const { id } = use(params);

    console.log("Editing department with ID:", id);

    const form = useForm({
        resolver: zodResolver(departmentSchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchDepartment = async () => {
            const res = await fetch(`/api/library/department/${id}`);
            if (res.ok) {
                console.log("Department data fetched successfully", res);
                const data = await res.json();
                setValue("department_name", data.department_name);
            }
        };

        fetchDepartment();
    }, [id, setValue]);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch(`/api/library/department/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if(res.ok) {
            setMessage("Department updated successfully");
            toast.success("Department updated successfully");
        } else {
            setMessage("An error occurred");
            toast.error("An error occurred while updating the department");
        }

    };

    return (
        <Wrapper heading="Update Department">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField  
                    label="Department Name"
                    name="department_name"
                    placeholder="Enter department name"
                    register={register}
                    errors={form.formState.errors.department_name}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
                    Update Department
                </button>
            </form>
        </Wrapper>
    )
}