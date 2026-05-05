"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";

export default function Home() {
    const router = useRouter();
    const [users, setusers] = useState<{
        id: number;
        id_card_no: string;
        name: string;
        phone_no: string;
        is_active: boolean;
        email: string;
        is_admin: boolean;
        department: string | null;
        designation: string | null;
        company: string | null;
    }[]>([]);

    useEffect(() => {
        fetch("/api/users").then((res) => res.json()).then((data) => {
            setusers(data.users);
        })
        .catch((err) => console.error(err));
    }, []);

    return (
        <Wrapper heading="User Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />
                    <button className="ml-2 bg-primary text-white px-4 py-1 rounded-md">
                        Search
                    </button>
                </div>
                {/* New User Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-8 py-2 rounded-md"
                        onClick={() => router.push("/admin/users/new")}
                    >
                        Add New User
                    </button>
                </div>
            </div>
            {users.length > 0 ? (
                <table className="w-full border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">Name</th>
                        <th className="border border-gray-300 p-2">Email</th>
                        <th className="border border-gray-300 p-2">Phone</th>
                        <th className="border border-gray-300 p-2">Department</th>
                        <th className="border border-gray-300 p-2">Designation</th>
                        <th className="border border-gray-300 p-2">Company</th> 
                        <th className="border border-gray-300 p-2">Is Active</th>
                        <th className="border border-gray-300 p-2">Is Admin</th>
                        <th className="border border-gray-300 p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="odd:bg-gray-50 border border-gray-300">
                            <td className="border-r-2 border-gray-300 p-2">{user.name}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.email}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.phone_no}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.department}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.designation}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.company}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.is_active ? "Yes" : "No"}</td>
                            <td className="border-r-2 border-gray-300 p-2">{user.is_admin ? "Yes" : "No"}</td>
                            <td className="p-2 flex justify-center flex-wrap gap-2">
                                <button 
                                    className="mr-2"
                                    onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                                >
                                    <Image src={editIcon.src} alt="Edit" width={16} height={16} />
                                </button>
                                <button>
                                    <Image src={deleteIcon.src} alt="Delete" width={16} height={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            ) : (
                <p>No users found.</p>
            )}
        </Wrapper>
    );
}