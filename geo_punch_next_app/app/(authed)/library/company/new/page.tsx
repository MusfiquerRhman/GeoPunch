"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { companySchema } from "../schema";
import { toast } from "sonner";

export default function NewCompany() {
    const form = useForm({
        resolver: zodResolver(companySchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch("/api/library/company", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (res.ok) {
            setMessage("Company created successfully");
            toast.success("Company created successfully");
        } else {
            setMessage("An error occurred");
            toast.error("An error occurred while creating the company");
        }

    };

    return (
        <Wrapper heading="Company Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField
                    label="Company Name"
                    name="name"
                    placeholder="Enter company name"
                    register={register}
                    errors={form.formState.errors.name?.message}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
                    Create Company
                </button>
            </form>
        </Wrapper>
    )
}