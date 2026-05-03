"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { designationSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

export default function NewDesignation() {
    const form = useForm({
        resolver: zodResolver(designationSchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch("/api/library/designation", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (res.ok) {
            setMessage("Designation created successfully");
        } else {
            setMessage("An error occurred");
        }

    };

    return (
        <Wrapper heading="Designation Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField
                    label="Designation"
                    name="designation"
                    placeholder="Enter designation"
                    register={register}
                    errors={form.formState.errors.designation}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
                    Create Designation
                </button>
            </form>
        </Wrapper>
    )
}