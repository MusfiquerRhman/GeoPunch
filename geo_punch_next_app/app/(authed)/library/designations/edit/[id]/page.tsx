"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { designationSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

type DesignationDetailsPageProps = {
    params: Promise<{ id: string }>
};

export default function Edit({ params }: DesignationDetailsPageProps) {
    const { id } = use(params);

    console.log("Editing designation with ID:", id);

    const form = useForm({
        resolver: zodResolver(designationSchema),
    });

    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchDesignation = async () => {
            const res = await fetch(`/api/library/designation/${id}`);
            if (res.ok) {
                console.log("Designation data fetched successfully", res);
                const data = await res.json();
                setValue("designation", data.designations);
            }
        };

        fetchDesignation();
    }, [id, setValue]);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch(`/api/library/designation/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if(res.ok) {
            setMessage("Designation updated successfully");
            toast.success("Designation updated successfully");
        } else {
            setMessage("An error occurred");
            toast.error("An error occurred while updating the designation");
        }

    };

    return (
        <Wrapper heading="Update Designation">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-[550]">
                <FormField  
                    label="Designation Name"
                    name="designation"
                    placeholder="Enter designation name"
                    register={register}
                    errors={form.formState.errors.designation}
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
                    Update Designation
                </button>
            </form>
        </Wrapper>
    )
}