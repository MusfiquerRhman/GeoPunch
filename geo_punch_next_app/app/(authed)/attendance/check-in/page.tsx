'use client';

import { Wrapper } from "@/components";
import PunchCard from "@/components/punchCard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
        setpage(0);
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

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["checkins", page, status],
        queryFn: fetchCheckins,
    });

    const records = data?.records ?? [];

    return (
         <Wrapper heading="Punch Management">
            <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Punch status">
                <button
                role="tab"
                aria-selected={status === 1}
                onClick={() => handleTabChange(1)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    status === 1
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                >
                    Pending
                </button>

                <button
                role="tab"
                aria-selected={status === 2}
                onClick={() => handleTabChange(2)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    status === 2
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                >
                    Accepted
                </button>

                <button
                role="tab"
                aria-selected={status === 0}
                onClick={() => handleTabChange(0)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    status === 0
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                >
                    Rejected
                </button>
            </div>
            <div className="flex min-h-40 flex-col gap-4 py-6" aria-live="polite" aria-busy={isFetching}>
                {isLoading ? (
                    <div className="flex max-w-3xl flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" role="status" aria-label="Loading punch records">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                            </div>
                            <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                        </div>
                        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                        <span className="sr-only">Loading punch records…</span>
                    </div>
                ) : error ? (
                    <div className="max-w-3xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
                        Couldn’t load punch records. Please try again.
                    </div>
                ) : records.length === 0 ? (
                    <div className="max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center">
                        <p className="font-medium text-gray-800">No {status === 1 ? "pending" : status === 2 ? "accepted" : "rejected"} punches</p>
                        <p className="mt-1 text-sm text-gray-500">There are no records to show on this page.</p>
                    </div>
                ) : (
                    records.map((r: CheckInRecord) => <PunchCard key={r.id} record={r} />)
                )}
            </div>

            <div className="flex w-full flex-row justify-center gap-3 pb-16">
                <button
                    onClick={prevPage}
                    disabled={page === 0}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={nextPage}
                    disabled={records.length < 10 || isFetching}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
         </Wrapper>
    )
}

export default CheckInPage;
