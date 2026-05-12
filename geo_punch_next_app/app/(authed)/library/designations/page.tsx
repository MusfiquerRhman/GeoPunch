"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";
import { toast } from "sonner";
import useDebouncedValue from "@/hooks/useDebouncedValue";

export default function DesignationsPage() {
    const router = useRouter();

    const [designations, setDesignations] = useState<{
        designations: { id: number; designations: string; }[];
        count: number;
    }>({ designations: [], count: 0 });

    const [search, setsearch] = useState('');
    const [page, setpage] = useState(0);

    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    const debouncedSearch = useDebouncedValue(search, 500);

    const fetchDesignations = async () => {
        try {
            const res = await fetch(`/api/library/designation?page=${page}&search=${encodeURIComponent(debouncedSearch)}`);
            if (res.ok) {                
                const data = await res.json();
                setDesignations(data);
            }
        }
        catch (err) {
            console.error("Error fetching designations:", err);
        }
    };

    useEffect(() => {
        fetchDesignations();
    }, [page, debouncedSearch]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this designation?")) {
            return;
        }

        try {
            const res = await fetch(`/api/library/designation/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setDesignations((prev) => ({
                    ...prev,
                    designations: prev.designations.filter((deg) => deg.id !== id)
                }));
                toast.success("Designation deleted successfully");
            }
            else {
                toast.error("Failed to delete designation");
            }
        }
        catch (err) {
            console.error("Error deleting designation:", err);
            toast.error("An error occurred while deleting the designation");
        }
    }

    return (
        <Wrapper heading="Designation Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        value={search}
                        onChange={(e) => setsearch(e.target.value)}
                        type="search"
                        placeholder="Search designations..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />     
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

            {designations.designations.length > 0 ? (
                <div className="flex flex-col gap-4">
                    <table className="w-full border border-gray-300 text-center">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 p-2">Name</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {designations.designations.map((designation) => (
                                <tr key={designation.id} className="odd:bg-gray-50 border border-gray-300">
                                    <td className="border border-gray-300 p-2">{designation.designations}</td>
                                    <td>
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

                    <div className="p-2 w-full flex flex-row justify-center gap-8 items-center">
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="hover:cursor-pointer bg-primary hover:bg-primary disabled:hover:cursor-not-allowed text-white py-2 px-4 rounded-md disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <p> {page + 1} / {Math.ceil(designations.count / 10)}</p>
                        <button
                            onClick={nextPage}
                            disabled={designations.designations.length < 10} 
                            className="hover:cursor-pointer bg-primary hover:bg-primary disabled:hover:cursor-not-allowed text-white py-2 px-4 rounded-md disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p>No designations found.</p>
            )}
        </Wrapper>
    );
}