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

        const response = await fetch("/api/library/company", {
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

        setMessage("Company created successfully");
        toast.success("Company created successfully");
        setErrorMessage("");
        setIsLoading(false);
    };

    return (
        <Wrapper heading="Company Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField
                    label="Company Name"
                    name="name"
                    placeholder="Enter company name"
                    register={register}
                    errors={form.formState.errors.name?.message}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md" 
                    disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Company"}
                </button>
            </form>
        </Wrapper>
    )
}