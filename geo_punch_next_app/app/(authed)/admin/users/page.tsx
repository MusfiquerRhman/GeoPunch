"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { userSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

export default function Home() {
    const form = useForm({
        resolver: zodResolver(userSchema),
    });

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

    useEffect(() => {
        console.log('error', errors);
    }, [errors]);

    const onSubmit = async (data: any) => {
        console.log("Submitting form with data"); // Debug log
        const formData = new FormData();

        console.log(data);

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch("/api/users", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });


        console.log(res); // handle success/error here
    };

    return (
        <Wrapper heading="User Management">
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
                        {designations.map((d: any) => (
                            <option key={d.id} value={d.id}>
                                {d.designations}
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