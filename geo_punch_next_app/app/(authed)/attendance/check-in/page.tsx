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
    employee: { 
        id: string; 
        name: string; 
        id_card_no: string 
    }
};

const CheckInPage = () => {
    async function fetchCheckins() {
        const res = await fetch("/api/admin/checkin");
        if (!res.ok) throw new Error("Failed to fetch checkins");
        return res.json();
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ["checkins"],
        queryFn: fetchCheckins,
    });

    const records = data?.records ?? [];

    console.log("Fetched check-in records:", records);
    
    return (
         <Wrapper heading="Punch Management">
            <div className="flex flex-col gap-4">
                {records.map((r: CheckInRecord) => (
                    <PunchCard key={r.id} record={r} />
                ))}
            </div>
         </Wrapper>
    )
}

export default CheckInPage;