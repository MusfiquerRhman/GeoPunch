"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";

export default function Officepage() {
    const router = useRouter();
    const [offices, setOffices] = useState<{
        id: number;
        name: string;
        company: {
            name: string;
        };
    }[]>([]);

    useEffect(() => {
        fetch("/api/library/office").then((res) => res.json()).then((data) => {
            setOffices(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this office?")) {
            return;
        }

        try {
            const res = await fetch(`/api/library/office/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setOffices((prev) => prev.filter((office) => office.id !== id));
            }
            else {
                alert("Failed to delete office");
            }
        }
        catch (err) {
            console.error("Error deleting office:", err);
            alert("An error occurred while deleting the office");
        }
    }

    return (
        <Wrapper heading="Office Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search offices..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />
                    <button className="ml-2 bg-primary text-white px-4 py-1 rounded-md">
                        Search
                    </button>
                </div>
                {/* New Office Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-8 py-2 rounded-md"
                        onClick={() => router.push("/library/offices/new")}
                    >
                        Add New Office 
                    </button>
                </div>
            </div>

            {offices?.length > 0 ? (
                <table className="w-full border border-gray-300 text-center">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Name</th>
                            <th className="border border-gray-300 p-2">Company</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {offices.map((office) => (
                            <tr key={office.id} className="odd:bg-gray-50 border border-gray-300">
                                <td className="border border-gray-300 p-2">{office.name}</td>
                                <td className="border border-gray-300 p-2">{office.company.name}</td>
                                <td className="p-2">
                                    <button 
                                        className="mr-2"
                                        onClick={() => router.push(`/library/offices/edit/${office.id}`)}
                                    >
                                        <Image src={editIcon} alt="Edit" width={20} height={20} />
                                    </button>
                                    <button onClick={() => handleDelete(office.id)}>
                                        <Image src={deleteIcon} alt="Delete" width={20} height={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No offices found.</p>
            )}
        </Wrapper>
    );
}