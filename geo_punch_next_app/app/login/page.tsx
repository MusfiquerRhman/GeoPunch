"use client";

import { useForm } from "react-hook-form";
import { loginSchema } from "./loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { banner } from "@/assets";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Login = () => {
    const router = useRouter();

    const [token, setToken] = useState<string | undefined>();
    const [error, seterror] = useState("");

    const form = useForm({
        resolver: zodResolver(loginSchema),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    useEffect(() => {
        const local_token = localStorage.getItem("token");

        if (local_token) {
            setToken(local_token);
            router.push("/");
        }
    }, [router]);

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(data),
            });

            console.log("Login response:", res.ok);

            const result = await res.json();

            if (!res.ok) {
                console.error(result);

                seterror(
                    result.error ||
                    "Login failed. Please check your credentials and try again."
                );

                return;
            }

            const token = result.token;

            localStorage.setItem("token", token);
            setToken(token);

            // fallback: set a non-HttpOnly cookie so middleware sees the token
            try {
                const cookieVal = encodeURIComponent(token);
                document.cookie = `token=${cookieVal}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
                console.log("document.cookie after set:", document.cookie);
            } catch (e) {
                console.error("failed to set fallback cookie", e);
            }

            // navigate to home and refresh server components
            await router.push("/");
            try {
                router.refresh();
            } catch (e) {
                // ignore refresh errors
            }
        } catch (err) {
            console.error("Login request failed:", err);

            seterror(
                "An error occurred while trying to log in. Please try again."
            );
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
                <Image
                    src={banner.src}
                    alt="GeoPunch Logo"
                    width={300}
                    height={100}
                    className="mx-auto mb-4"
                />

                <h2 className="text-2xl font-bold text-center">
                    Login to Your Account
                </h2>

                <p className="text-red-500 text-center">
                    {error}
                </p>

                <form
                    className="space-y-6"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div>
                        <label
                            htmlFor="id_card_no"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Id Card No
                        </label>

                        <input
                            type="text"
                            id="id_card_no"
                            required
                            placeholder="Enter your id card no"
                            {...register("id_card_no")}
                            className="w-full px-3 py-2 mt-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />

                        {errors.id_card_no?.message && (
                            <p className="text-red-500 text-sm">
                                {errors.id_card_no.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            {...register("password")}
                            className="w-full px-3 py-2 mt-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />

                        {errors.password?.message && (
                            <p className="text-red-500 text-sm">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;