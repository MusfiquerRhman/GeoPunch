"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { designationSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import PageLoading from "@/components/UI/PageLoading";

type DesignationDetailsPageProps = {
    params: Promise<{ id: string }>
};

export default function Edit({ params }: DesignationDetailsPageProps) {
    const { id } = use(params);

    console.log("Editing designation with ID:", id);

    const form = useForm({
        resolver: zodResolver(designationSchema),
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchDesignation = async () => {
            try {
                const res = await fetch(`/api/library/designation/${id}`);
                if (!res.ok) throw new Error("Failed to fetch designation");
                const data = await res.json();
                setValue("designation", data.designations);
            } catch (error) {
                console.error("Error fetching designation:", error);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDesignation();
    }, [id, setValue]);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch(`/api/library/designation/${id}`, {
            method: "PUT",
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
            return;
        }

        setMessage("Designation updated successfully"); 
        toast.success("Designation updated successfully");
    };

    return (
        <Wrapper heading="Update Designation">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            {isLoading ? <PageLoading /> : loadError ? (
                <p className="max-w-[550px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load this designation. Please go back and try again.</p>
            ) : <form onSubmit={handleSubmit(onSubmit)} className="form-panel flex max-w-[550px] flex-col gap-4">
                <FormField  
                    label="Designation Name"
                    name="designation"
                    placeholder="Enter designation name"
                    register={register}
                    errors={form.formState.errors.designation}
                />
                <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                    Update Designation
                </button>
            </form>}
        </Wrapper>
    )
}
