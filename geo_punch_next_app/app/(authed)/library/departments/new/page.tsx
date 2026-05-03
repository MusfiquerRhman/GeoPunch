"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { departmentSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewDepartment() {
    const form = useForm({
        resolver: zodResolver(departmentSchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch("/api/library/department", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if(res.ok) {
            setMessage("Department created successfully");
            toast.success("Department created successfully");
        } else {
            setMessage("An error occurred");
            toast.error("An error occurred while creating the department");
        }

    };

    return (
        <Wrapper heading="Department Management">
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
                    Create Department
                </button>
            </form>
        </Wrapper>
    )
}