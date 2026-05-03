"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";

export default function CompanyPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<{
        id: number;
        name: string;
    }[]>([]);

    useEffect(() => {
        fetch("/api/library/company").then((res) => res.json()).then((data) => {
            setCompanies(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this company?")) {
            return;
        }

        try {
            const res = await fetch(`/api/library/company/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCompanies((prev) => prev.filter((company) => company.id !== id));
            }
            else {
                alert("Failed to delete company");
            }
        }
        catch (err) {
            console.error("Error deleting company:", err);
            alert("An error occurred while deleting the company");
        }
    }

    return (
        <Wrapper heading="Company Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search companies..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />
                    <button className="ml-2 bg-primary text-white px-4 py-1 rounded-md">
                        Search
                    </button>
                </div>
                {/* New Company Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-8 py-2 rounded-md"
                        onClick={() => router.push("/library/company/new")}
                    >
                        Add New Company 
                    </button>
                </div>
            </div>

            {companies?.length > 0 ? (
                <table className="w-full border border-gray-300 text-center">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Name</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {companies.map((company) => (
                            <tr key={company.id}>
                                <td className="border border-gray-300 p-2">{company.name}</td>
                                <td className="border border-gray-300 p-2">
                                    <button 
                                        className="mr-2"
                                        onClick={() => router.push(`/library/company/edit/${company.id}`)}
                                    >
                                        <Image src={editIcon} alt="Edit" width={20} height={20} />
                                    </button>
                                    <button onClick={() => handleDelete(company.id)}>
                                        <Image src={deleteIcon} alt="Delete" width={20} height={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No companies found.</p>
            )}
        </Wrapper>
    );
}