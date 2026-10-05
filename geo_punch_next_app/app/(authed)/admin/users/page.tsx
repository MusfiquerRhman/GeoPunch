"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";
import useDebouncedValue from "@/hooks/useDebouncedValue";

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

    const [search, setsearch] = useState('');
    const [page, setpage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    const debouncedSearch = useDebouncedValue(search, 500);

    const fetchUsers = async () => {
        setIsLoading(true);
        setHasError(false);
        try {
            const res = await fetch(`/api/users?page=${page}&search=${encodeURIComponent(debouncedSearch)}`);
            if (!res.ok) throw new Error("Failed to fetch users");
            setusers(await res.json());
        }
        catch (err) {
            console.error("Error fetching users:", err);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    return (
        <Wrapper heading="User Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search users name, email, id card and phone..."
                        className="w-full max-w-[350px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        value={search}
                        onChange={(e) => setsearch(e.target.value)}
                    />
                </div>
                {/* New User Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
                        onClick={() => router.push("/admin/users/new")}
                    >
                        Add New User
                    </button>
                </div>
            </div>
            {isLoading ? (
                <div className="max-w-5xl space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" role="status" aria-label="Loading users">
                    {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded bg-gray-100" />)}
                    <span className="sr-only">Loading users…</span>
                </div>
            ) : hasError ? (
                <p className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load users. Please try again.</p>
            ) : users && users.users.length > 0 ? (
                <div className="flex flex-col gap-4">
                    <div className="overflow-x-auto rounded-2xl">
                    <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Company</th>
                            <th>Is Active</th>
                            <th>Is Admin</th>
                            <th className="cell-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users!.users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.phone_no}</td>
                                <td>{user.department}</td>
                                <td>{user.designation}</td>
                                <td>{user.company}</td>
                                <td>{user.is_active ? "Yes" : "No"}</td>
                                <td>{user.is_admin ? "Yes" : "No"}</td>
                                <td className="cell-actions whitespace-nowrap">
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
                </div>

                <div className="p-2 w-full flex flex-row justify-center gap-8 items-center">
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <p> {page + 1} / {Math.ceil((users?.count ?? 0) / 10)}</p>
                        <button
                            onClick={nextPage}
                            disabled={!(users && users.users.length >= 10)} 
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p className="max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-600">No users found. Try a different search or add a user.</p>
            )}
        </Wrapper>
    );
}
