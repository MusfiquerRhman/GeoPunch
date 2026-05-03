"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";

export default function Officepage() {
    const router = useRouter();
    const [designations, setDesignations] = useState<{
        id: number;
        designations: string;
    }[]>([]);

    useEffect(() => {
        fetch("/api/library/designation").then((res) => res.json()).then((data) => {
            setDesignations(data);
        })
        .catch((err) => console.error(err));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this designation?")) {
            return;
        }

        try {
            const res = await fetch(`/api/library/designation/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setDesignations((prev) => prev.filter((deg) => deg.id !== id));
            }
            else {
                alert("Failed to delete designation");
            }
        }
        catch (err) {
            console.error("Error deleting designation:", err);
            alert("An error occurred while deleting the designation");
        }
    }

    return (
        <Wrapper heading="Designation Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        type="text"
                        placeholder="Search designations..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />
                    <button className="ml-2 bg-primary text-white px-4 py-1 rounded-md">
                        Search
                    </button>
                </div>
                {/* New Designation Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-8 py-2 rounded-md"
                        onClick={() => router.push("/library/designations/new")}
                    >
                        Add New Designation 
                    </button>
                </div>
            </div>

            {designations?.length > 0 ? (
                <table className="w-full border border-gray-300 text-center">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Name</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {designations.map((designation) => (
                            <tr key={designation.id}>
                                <td className="border border-gray-300 p-2">{designation.designations}</td>
                                <td className="border border-gray-300 p-2">
                                    <button 
                                        className="mr-2"
                                        onClick={() => router.push(`/library/designations/edit/${designation.id}`)}
                                    >
                                        <Image src={editIcon} alt="Edit" width={20} height={20} />
                                    </button>
                                    <button onClick={() => handleDelete(designation.id)}>
                                        <Image src={deleteIcon} alt="Delete" width={20} height={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No designations found.</p>
            )}
        </Wrapper>
    );
}