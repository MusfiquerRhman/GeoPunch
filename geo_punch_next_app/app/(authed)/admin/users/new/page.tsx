"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { userSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewUsers() {
    const form = useForm({
        resolver: zodResolver(userSchema),
    });

    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    

    const { register, handleSubmit, formState: { errors } } = form;

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetch("/api/library/department").then((res) => res.json()).then((data) => {
        setDepartments(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const [designations, setDesignations] = useState([]);

    useEffect(() => {
        fetch("/api/library/designation").then((res) => res.json()).then((data) => {
            setDesignations(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        fetch("/api/library/company").then((res) => res.json()).then((data) => {
            setCompanies(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const onSubmit = async (data: any) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await fetch("/api/users", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        
        const res = await response.json(); 

        if (!res.ok) {
            setErrorMessage(res.message);
            setMessage("");
            return;
        }

        setMessage("User created successfully");
    };

    return (
        <Wrapper heading="User Management">
            {message && <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>}
            {errorMessage && <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>}
            <form onSubmit={handleSubmit(onSubmit)}
                className="flex flex-row flex-wrap gap-4 w-full max-w-[550]"
            >
                <FormField
                    label="Id Card No"
                    name="id_card_no"
                    placeholder="Id Card No"
                    register={register}
                    errors={form.formState.errors.id_card_no}
                />
                <FormField
                    label="Name"
                    name="name"
                    placeholder="Name"
                    register={register}
                    errors={form.formState.errors.name}
                />
                <FormField
                    label="Phone No"
                    name="phone_no"
                    placeholder="Phone Number"
                    register={register}
                    errors={form.formState.errors.phone_no}
                />
                <FormField
                    label="Email"
                    name="email"
                    placeholder="Email"
                    register={register}
                    errors={form.formState.errors.email}
                />
                <FormField
                    label="Password"
                    name="password"
                    placeholder="Password"
                    type="password"
                    register={register}
                    errors={form.formState.errors.password}
                />
                <div className="flex w-full">
                    <label className="font-medium flex-1">Department ID</label>
                    <select defaultValue={''} {...register("department_id")} 
                        className="rounded-md px-2 py-1 border-2 border-primary w-[250] flex-3"
                    >
                        <option disabled value="">Select Department</option>
                        {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>
                                {d.department_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-full">
                    <label className="font-medium flex-1">Designation ID</label>
                    <select defaultValue={''} {...register("designation_id")} 
                        className="rounded-md px-2 py-1 border-2 border-primary w-[250] flex-3"
                    >
                        <option disabled value="">Select Designation</option>
                        {(designations ?? []).map((d: any) => (
                            <option key={d.id} value={d.id}>
                                {d.designations}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-full">
                    <label className="font-medium flex-1">Company ID</label>
                    <select defaultValue={''} {...register("company_id")} 
                        className="rounded-md px-2 py-1 border-2 border-primary w-[250] flex-3"
                    >
                        <option disabled value="">Select Company</option>
                        {(companies ?? []).map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
               <div className="flex w-full gap-4 items-center">
                    <label className="font-medium w-1/5 m-1">Active</label>
                    <input
                        type='checkbox'
                        className="border-2 border-primary w-5 h-5 px-2 py-1 rounded-md"
                        {...register("isActive", { setValueAs: (v) => v === true || v === "on", })}
                    />
                </div>
                <div className="flex w-full gap-4 items-center">
                    <label className="font-medium w-1/5 m-1">Admin</label>
                    <input
                        type='checkbox'
                        className="border-2 border-primary w-5 h-5 px-2 py-1 rounded-md"
                        {...register("isAdmin", { setValueAs: (v) => v === true || v === "on", })}
                    />
                </div>
                <button type="submit"
                    className="bg-primary w-full p-2 rounded-md text-white cursor-pointer"
                >
                    Submit
                </button>
            </form>
        </Wrapper>
    );
}