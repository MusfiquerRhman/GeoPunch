"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { userSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    return (
        <Wrapper heading="User Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="border-2 border-primary w-full px-2 py-1 rounded-md"
                    />
                    <button className="ml-2 bg-primary text-white px-4 py-1 rounded-md">
                        Search
                    </button>
                </div>
                {/* New User Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-4 py-1 rounded-md"
                        onClick={() => router.push("/admin/users/new")}
                    >
                        Add New User
                    </button>
                </div>
            </div>
            <table className="w-full border">
                <thead>
                    <tr>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Email</th>
                    </tr>
                </thead>
                {/* <tbody>
                    {users.map((user) => (
                    <tr key={user.id}>
                        <td className="border p-2">{user.name}</td>
                        <td className="border p-2">{user.email}</td>
                    </tr>
                    ))}
                </tbody> */}
            </table>
        </Wrapper>
    );
}