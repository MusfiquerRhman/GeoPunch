'use client';

import { Wrapper } from "@/components";
import PunchCard from "@/components/punchCard";
import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CheckInRecord { 
    id: string; 
    latitude: number; 
    longitude: number;
    selfie_url: string; 
    submitted_at: Date; 
    status: number; 
    address: string;
    distance: number;
    nearest_office_address: string | null;
    nearest_office_name: string | null;
    employee: { 
        id: string; 
        name: string; 
        id_card_no: string 
    }
};

type TabType = 0 | 1 | 2;

const CheckInPage = () => {
    const [page, setpage] = useState(0);

    const [status, setStatus] = useState<TabType>(1);

    const handleTabChange = (tab: TabType) => {
        setStatus(tab);

        // 👉 you can trigger API calls here if needed
        // fetchData(tab)
        console.log("Selected:", tab);
    };
    
    const nextPage = () => {
        setpage(page => page + 1);
    }

    const prevPage = () => {
        setpage(page => page - 1);
    }

    async function fetchCheckins() {
        const res = await fetch(`/api/admin/checkin?page=${page}&status=${status}`);
        if (!res.ok) throw new Error("Failed to fetch checkins");
        return res.json();
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ["checkins", page, status],
        queryFn: fetchCheckins,
    });

    const records = data?.records ?? [];

    return (
         <Wrapper heading="Punch Management">
            <div className="flex gap-2 pb-2">
                <button
                onClick={() => handleTabChange(1)}
                className={`px-4 py-2 ${
                    status === 1
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-gray-500"
                }`}
                >
                    Pending
                </button>

                <button
                onClick={() => handleTabChange(2)}
                className={`px-4 py-2 ${
                    status === 2
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-gray-500"
                }`}
                >
                    Accepted
                </button>

                <button
                onClick={() => handleTabChange(0)}
                className={`px-4 py-2 ${
                    status === 0
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-gray-500"
                }`}
                >
                    Rejected
                </button>
            </div>
            <div className="flex flex-col gap-4 py-6">
                {records.map((r: CheckInRecord) => (
                    <PunchCard key={r.id} record={r} />
                ))}
            </div>

            <div className="mx-8 pb-16 w-full flex flex-row justify-center gap-8">
                <button
                    onClick={prevPage}
                    disabled={page === 0}
                    className="hover:cursor-pointer bg-primary-300 hover:bg-primary-400 text-gray-800 py-2 px-4 rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={nextPage}
                    disabled={records.length < 10} 
                    className="hover:cursor-pointer bg-primary-300 hover:bg-primary-400 text-gray-800 py-2 px-4 rounded-r disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
         </Wrapper>
    )
}

export default CheckInPage;