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

    const [error, seterror] = useState("");
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(loginSchema),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    useEffect(() => {
        fetch("/api/auth/session")
            .then(async (res) => res.ok ? res.json() : null)
            .then((session) => {
                if (session?.authenticated && session.isAdmin) router.replace("/attendance/check-in");
            })
            .catch(() => undefined)
            .finally(() => setIsCheckingSession(false));
    }, [router]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        seterror("");
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

            await router.replace("/attendance/check-in");
            router.refresh();
        } catch (err) {
            console.error("Login request failed:", err);

            seterror(
                "An error occurred while trying to log in. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingSession) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6" role="status" aria-label="Checking session">
                <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mx-auto h-12 w-40 animate-pulse rounded bg-gray-100" />
                    <div className="mx-auto h-6 w-52 animate-pulse rounded bg-gray-100" />
                    <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
                    <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
                    <span className="sr-only">Checking your session…</span>
                </div>
            </main>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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

                <p className="min-h-5 text-center text-sm text-red-600" role="alert">
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />

                        {errors.password?.message && (
                            <p className="text-red-500 text-sm">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-70"
                    >
                        {isSubmitting ? "Signing in…" : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
