"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Wrapper from "@/components/UI/Wrapper";
import FormField from "@/components/UI/FormField";
import PageLoading from "@/components/UI/PageLoading";
import { requestJson } from "@/utils/adminForms";
import { companySchema } from "@/app/(authed)/library/company/schema";
import { departmentSchema } from "@/app/(authed)/library/departments/schema";
import { designationSchema } from "@/app/(authed)/library/designations/schema";

const resources = {
    company: { label: "Company", input: "name", output: "name", schema: z.object({ name: companySchema.shape.name }) },
    department: { label: "Department", input: "department_name", output: "department_name", schema: z.object({ name: departmentSchema.shape.department_name }) },
    designation: { label: "Designation", input: "designation", output: "designations", schema: z.object({ name: designationSchema.shape.designation }) },
};

export default function LibraryNameForm({ resource, id }: { resource: keyof typeof resources; id?: string }) {
    const config = resources[resource];
    const endpoint = `/api/library/${resource}${id ? `/${id}` : ""}`;
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(!!id);
    const [loadError, setLoadError] = useState("");
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ name: string }>({
        resolver: zodResolver(config.schema), defaultValues: { name: "" },
    });

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setLoadError("");
            try {
                const record = await requestJson<Record<string, string>>(endpoint, { signal: controller.signal });
                if (!controller.signal.aborted) reset({ name: record[config.output] ?? "" });
            } catch (failure) {
                if (!controller.signal.aborted) setLoadError(failure instanceof Error ? failure.message : "Could not load this record.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [id, endpoint, config, reset]);

    async function save(values: { name: string }) {
        setMessage("");
        setError("");
        try {
            const saved = await requestJson<Record<string, string>>(endpoint, {
                method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [config.input]: values.name }),
            });
            reset({ name: id ? saved[config.output] : "" });
            const success = `${config.label} ${id ? "updated" : "created"} successfully`;
            setMessage(success);
            toast.success(success);
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : "Could not save this record. Please try again.";
            setError(message);
            toast.error(message);
        }
    }

    return (
        <Wrapper heading={id ? `Update ${config.label}` : `${config.label} Management`} scrollable>
            {message && <p role="status" className="mb-4 max-w-[550px] rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">{message}</p>}
            {error && <p role="alert" className="mb-4 max-w-[550px] rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
            {loading ? <PageLoading /> : loadError ? <p role="alert" className="text-red-700">{loadError} Please reload and try again.</p> : (
                <form onSubmit={handleSubmit(save, () => { setMessage(""); setError("Please correct the highlighted field before saving."); })} className="form-panel flex max-w-[550px] flex-col gap-4">
                    <fieldset disabled={isSubmitting} className="contents">
                        <FormField label={`${config.label} Name`} name="name" placeholder={`Enter ${config.label.toLowerCase()} name`} register={register} errors={errors.name} />
                        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
                            {isSubmitting ? "Saving…" : `${id ? "Update" : "Create"} ${config.label}`}
                        </button>
                    </fieldset>
                </form>
            )}
        </Wrapper>
    );
}
