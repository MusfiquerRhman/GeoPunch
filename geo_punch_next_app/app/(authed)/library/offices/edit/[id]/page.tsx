"use client";

import { use } from "react";
import OfficeForm from "@/components/admin/OfficeForm";

export default function EditOfficePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <OfficeForm id={id} key={id} />;
}
