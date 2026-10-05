"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { departmentSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import PageLoading from "@/components/UI/PageLoading";

type DepartmentDetailsPageProps = {
    params: Promise<{ id: string }>
};


export default function Edit({ params }: DepartmentDetailsPageProps) {
    const { id } = use(params);

    console.log("Editing department with ID:", id);

    const form = useForm({
        resolver: zodResolver(departmentSchema),
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue } = form;

    useEffect(() => {   
        const fetchDepartment = async () => {
            try {
                const res = await fetch(`/api/library/department/${id}`);
                if (!res.ok) throw new Error("Failed to fetch department");
                const data = await res.json();
                setValue("department_name", data.department_name);
            } catch (error) {
                console.error("Error fetching department:", error);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDepartment();
    }, [id, setValue]);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch(`/api/library/department/${id}`, {
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

        setMessage("Department updated successfully");
        toast.success("Department updated successfully");
    };

    return (
        <Wrapper heading="Update Department">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {isLoading ? <PageLoading /> : loadError ? (
                <p className="max-w-[550px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load this department. Please go back and try again.</p>
            ) : <form onSubmit={handleSubmit(onSubmit)} className="form-panel flex max-w-[550px] flex-col gap-4">
                <FormField  
                    label="Department Name"
                    name="department_name"
                    placeholder="Enter department name"
                    register={register}
                    errors={form.formState.errors.department_name}
                />
                <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                    Update Department
                </button>
            </form>}
        </Wrapper>
    )
}
