"use client";

import { Wrapper } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIcon, editIcon } from "@/assets";
import Image from "next/image";
import { toast } from "sonner";
import useDebouncedValue from "@/hooks/useDebouncedValue";

export default function DepartmentsPage() {
    const router = useRouter();

    const [departments, setDepartments] = useState<{
        departments: { id: number; department_name: string; }[];
        count: number;
    }>({ departments: [], count: 0 });

    const [search, setsearch] = useState('')
    const [page, setpage] = useState(0);

    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    const debouncedSearch = useDebouncedValue(search, 500);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`/api/library/department?page=${page}&search=${encodeURIComponent(debouncedSearch)}`);
            if (res.ok) {                
                const data = await res.json();
                setDepartments(data);
            }
        }
        catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, [page, debouncedSearch]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this department?")) {
            return;
        }

        try {
            const res = await fetch(`/api/library/department/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setDepartments((prev) => ({
                    ...prev,
                    departments: prev.departments.filter((dept) => dept.id !== id),
                }));
                toast.success("Department deleted successfully");
            }
            else {
                toast.error("Failed to delete department");
            }
        }
        catch (err) {
            console.error("Error deleting department:", err);
            toast.error("An error occurred while deleting the department");
        }
    }

    return (
        <Wrapper heading="Department Management">
            <div className="flex flex-row gap-8 w-full">
                {/* Search Bar */}
                <div className="flex mb-4 flex-1">
                    <input
                        value={search}
                        onChange={(e) => setsearch(e.target.value)}
                        type="text"
                        placeholder="Search departments..."
                        className="border-2 border-primary w-full max-w-[350] px-2 py-1 rounded-md"
                    />
                </div>
                {/* New Department Button */}
                <div className="mb-4 flex-1 items-end flex justify-end">
                    <button 
                        className="bg-primary text-white px-8 py-2 rounded-md"
                        onClick={() => router.push("/library/departments/new")}
                    >
                        Add New Department   
                    </button>
                </div>
            </div>

            {departments.departments.length > 0 ? (
                <div className="flex flex-col gap-4">
                    <table className="w-full border border-gray-300 text-center">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 p-2">Name</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {departments.departments.map((department) => (
                                <tr key={department.id} className="odd:bg-gray-50 border border-gray-300">
                                    <td className="border border-gray-300 p-2">{department.department_name}</td>
                                    <td>
                                        <button 
                                            className="mr-2"
                                            onClick={() => router.push(`/library/departments/edit/${department.id}`)}
                                        >
                                            <Image src={editIcon} alt="Edit" width={20} height={20} />
                                        </button>
                                        <button onClick={() => handleDelete(department.id)}>    
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
                        <p> {page + 1} / {Math.ceil(departments.count / 10)}</p>
                        <button
                            onClick={nextPage}
                            disabled={departments.departments.length < 10} 
                            className="hover:cursor-pointer bg-primary hover:bg-primary disabled:hover:cursor-not-allowed text-white py-2 px-4 rounded-md disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p>No departments found.</p>
            )}
        </Wrapper>
    );
}