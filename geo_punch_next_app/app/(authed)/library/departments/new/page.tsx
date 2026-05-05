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

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch("/api/library/department", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const res = await response.json(); 

        if (!res.ok) {
            setErrorMessage(res.message); 
            toast.error(res.message || "An error occurred while creating the office");
            setMessage("");
            return;
        }

        setMessage("Department created successfully");
        toast.success("Department created successfully");
    };

    return (
        <Wrapper heading="Department Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
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