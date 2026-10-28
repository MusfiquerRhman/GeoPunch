"use client";

import { use } from "react";
import LibraryNameForm from "@/components/admin/LibraryNameForm";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <LibraryNameForm resource="company" id={id} key={id} />;
}
