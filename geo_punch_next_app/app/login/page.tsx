'use client';

import { useForm } from "react-hook-form";
import { loginSchema } from "./loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { banner } from "@/assets";
import Image from "next/image";
import router from "next/dist/shared/lib/router/router";
import { useRouter } from "next/navigation";
import { useState } from "react";

const login = () => {
    const router = useRouter();

    const [error, seterror] = useState('')

    const form = useForm({
        resolver: zodResolver(loginSchema),
    });

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: any) => {
        console.log("Submitting form with data"); // Debug log
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const res = await fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(async (res) => {
            if (res.ok) {
                console.log(res);
            } else {
                const err = await res.json();
                console.error(err);
                seterror(err.error || "Login failed. Please check your credentials and try again.");
            }
        })
        .catch((err) => {
            console.error("Login request failed:", err);
            seterror("An error occurred while trying to log in. Please try again.");
        });

        console.log(res);
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
                <Image src={banner.src} alt="GeoPunch Logo" width={300} height={100} className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-center">Login to Your Account</h2>
                <p className="text-red-500 text-center">{error}</p>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="id_card_no" className="block text-sm font-medium text-gray-700">Id Card No</label>
                        <input
                            type="id_card_no"
                            id="id_card_no"
                            required
                            placeholder="Enter your id card no"
                            {...register("id_card_no")}
                            className="w-full px-3 py-2 mt-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                        {errors.id_card_no?.message && <p className="text-red-500 text-sm">{errors.id_card_no.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            {...register("password")}
                            className="w-full px-3 py-2 mt-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                        {errors.password?.message && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring focus:border-blue-300"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default login;