"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";

export default function Home() {
    const router = useRouter();
    const [users, setusers] = useState<{
        users: {
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
        }[];
        count: number;
    } | null>(null);

    const [page, setpage] = useState(0);

    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    useEffect(() => {
        fetch(`/api/users?page=${page}`).then((res) => res.json()).then((data) => {
            setusers(data);
        })
        .catch((err) => console.error(err));
    }, [page]);

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
            {users && users.users.length > 0 ? (
                <div className="flex flex-col gap-4">
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
                        {users!.users.map((user) => (
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

                <div className="p-2 w-full flex flex-row justify-center gap-8 items-center">
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="hover:cursor-pointer bg-primary hover:bg-primary disabled:hover:cursor-not-allowed text-white py-2 px-4 rounded-md disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <p> {page + 1} / {Math.ceil((users?.count ?? 0) / 10)}</p>
                        <button
                            onClick={nextPage}
                            disabled={!(users && users.users.length >= 10)} 
                            className="hover:cursor-pointer bg-primary hover:bg-primary disabled:hover:cursor-not-allowed text-white py-2 px-4 rounded-md disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p>No users found.</p>
            )}
        </Wrapper>
    );
}