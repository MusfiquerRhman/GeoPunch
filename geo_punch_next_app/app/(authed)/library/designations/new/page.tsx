"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { designationSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewDesignation() {
    const form = useForm({
        resolver: zodResolver(designationSchema),
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch("/api/library/designation", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const res = await response.json(); 

        if (!response.ok) {
            setErrorMessage(res.message); 
            toast.error(res.message || "An error occurred while creating the office");
            setMessage("");
            setIsLoading(false);
            return;
        }

        setMessage("Designation created successfully");
        toast.success("Designation created successfully");
        setIsLoading(false);

    };

    return (
        <Wrapper heading="Designation Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="form-panel flex max-w-[550px] flex-col gap-4">
                <FormField
                    label="Designation"
                    name="designation"
                    placeholder="Enter designation"
                    register={register}
                    errors={form.formState.errors.designation}
                />
                <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Designation"}
                </button>
            </form>
        </Wrapper>
    )
}
