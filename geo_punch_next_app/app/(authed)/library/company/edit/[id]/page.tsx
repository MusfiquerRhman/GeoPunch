"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { companySchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

type CompanyDetailsPageProps = {
    params: Promise<{ id: string }>
};

export default function Edit({ params }: CompanyDetailsPageProps) {
    const { id } = use(params);

    console.log("Editing company with ID:", id);

    const form = useForm({
        resolver: zodResolver(companySchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchCompany = async () => {
            const res = await fetch(`/api/library/company/${id}`);
            if (res.ok) {
                console.log("Company data fetched successfully", res);
                const data = await res.json();
                setValue("name", data.name);
            }
        };

        fetchCompany();
    }, [id, setValue]);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch(`/api/library/company/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if(res.ok) {
            setMessage("Company updated successfully");
            toast.success("Company updated successfully");
        } else {
            setMessage("An error occurred");
            toast.error("An error occurred while updating the company");
        }

    };

    return (
        <Wrapper heading="Update Company">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField  
                    label="Company Name"
                    name="name"
                    placeholder="Enter company name"
                    register={register}
                    errors={form.formState.errors.name}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
                    Update Designation
                </button>
            </form>
        </Wrapper>
    )
}