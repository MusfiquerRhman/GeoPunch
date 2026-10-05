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
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    const debouncedSearch = useDebouncedValue(search, 500);

    const fetchDesignations = async () => {
        setIsLoading(true);
        setHasError(false);
        try {
            const res = await fetch(`/api/library/designation?page=${page}&search=${encodeURIComponent(debouncedSearch)}`);
            if (!res.ok) throw new Error("Failed to fetch designations");
            setDesignations(await res.json());
        }
        catch (err) {
            console.error("Error fetching designations:", err);
            setHasError(true);
        } finally {
            setIsLoading(false);
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
                        className="w-full max-w-[350px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />     
                </div>
                {/* New Designation Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
                        onClick={() => router.push("/library/designations/new")}
                    >
                        Add New Designation 
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="max-w-3xl space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" role="status" aria-label="Loading designations">
                    {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded bg-gray-100" />)}
                    <span className="sr-only">Loading designations…</span>
                </div>
            ) : hasError ? (
                <p className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Couldn’t load designations. Please try again.</p>
            ) : designations.designations.length > 0 ? (
                <div className="flex flex-col gap-4">
                    <div className="overflow-x-auto rounded-2xl">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th className="cell-actions">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {designations.designations.map((designation) => (
                                <tr key={designation.id}>
                                    <td>{designation.designations}</td>
                                    <td className="cell-actions">
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
                    </div>

                    <div className="p-2 w-full flex flex-row justify-center gap-8 items-center">
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <p> {page + 1} / {Math.ceil(designations.count / 10)}</p>
                        <button
                            onClick={nextPage}
                            disabled={designations.designations.length < 10} 
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p className="max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-600">No designations found. Try a different search or add a designation.</p>
            )}
        </Wrapper>
    );
}
