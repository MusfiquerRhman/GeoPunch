"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Wrapper from "@/components/UI/Wrapper";
import FormField from "@/components/UI/FormField";
import PageLoading from "@/components/UI/PageLoading";
import MapPicker from "@/components/LocationSelector";
import { officeSchema } from "@/app/(authed)/library/offices/schema";
import { officeFormValues, emptyOfficeValues, emptyOfficeLocation, coordinateValue, type OfficeInput, type OfficeValues, type OfficeDetails } from "@/app/(authed)/library/offices/form-utils";
import { fetchAllOptions, requestJson } from "@/utils/adminForms";

export default function OfficeForm({ id }: { id?: string }) {
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<OfficeInput, unknown, OfficeValues>({
        resolver: zodResolver(officeSchema), defaultValues: emptyOfficeValues(),
    });
    const { fields, append, remove } = useFieldArray({ control, name: "locations", keyName: "formKey" });
    const locations = useWatch({ control, name: "locations" });

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setLoadError("");
            try {
                const [office, options] = await Promise.all([
                    id ? requestJson<OfficeDetails>(`/api/library/office/${id}`, { signal: controller.signal }) : Promise.resolve(null),
                    fetchAllOptions<{ id: string; name: string }>("/api/library/company", "companies", controller.signal),
                ]);
                if (controller.signal.aborted) return;
                setCompanies(options);
                reset(office ? officeFormValues(office) : emptyOfficeValues());
            } catch (failure) {
                if (!controller.signal.aborted) setLoadError(failure instanceof Error ? failure.message : "Could not load this office.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [id, reset]);

    async function save(values: OfficeValues) {
        setMessage("");
        setError("");
        try {
            const saved = await requestJson<OfficeDetails>(`/api/library/office${id ? `/${id}` : ""}`, {
                method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
            });
            reset(id ? officeFormValues(saved) : emptyOfficeValues());
            const success = `Office ${id ? "updated" : "created"} successfully`;
            setMessage(success);
            toast.success(success);
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : "Could not save this office. Please try again.";
            setError(message);
            toast.error(message);
        }
    }

    return (
        <Wrapper heading={id ? "Update Office" : "Office Management"} scrollable>
            {message && <p role="status" className="mb-4 max-w-[700px] rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">{message}</p>}
            {error && <p role="alert" className="mb-4 max-w-[700px] rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
            {loading ? <PageLoading /> : loadError ? <p role="alert" className="text-red-700">{loadError} Please reload and try again.</p> : (
                <form onSubmit={handleSubmit(save, () => { setMessage(""); setError("Please correct the highlighted fields before saving."); })} className="form-panel mb-6 flex max-w-[700px] flex-col gap-4">
                    <fieldset disabled={isSubmitting} className="contents">
                        <FormField label="Office Name" name="name" placeholder="Enter office name" register={register} errors={errors.name} />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="company_id" className="text-sm font-medium text-gray-700">Company</label>
                            <select id="company_id" {...register("company_id")} aria-invalid={!!errors.company_id} className="form-select">
                                <option value="">Select Company</option>
                                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                            </select>
                            {errors.company_id && <p className="text-sm text-red-600">{errors.company_id.message}</p>}
                        </div>
                        {fields.map((field, index) => {
                            const position = locations[index];
                            const coords = typeof position?.lat === "number" && Number.isFinite(position.lat) && typeof position?.lng === "number" && Number.isFinite(position.lng)
                                ? { lat: position.lat, lng: position.lng } : null;
                            const locationErrors = errors.locations?.[index];
                            return (
                                <div key={field.formKey} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Location {index + 1}</h3>
                                        {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="text-sm text-red-600">Remove</button>}
                                    </div>
                                    <label htmlFor={`location-${index}-address`} className="text-sm font-medium">Address</label>
                                    <input id={`location-${index}-address`} {...register(`locations.${index}.address`)} placeholder="Enter address" className="form-select" />
                                    {locationErrors?.address && <p className="text-sm text-red-600">{locationErrors.address.message}</p>}
                                    <MapPicker coords={coords} onSelect={(position) => {
                                        if (isSubmitting) return;
                                        setValue(`locations.${index}.lat`, position.lat, { shouldDirty: true, shouldValidate: true });
                                        setValue(`locations.${index}.lng`, position.lng, { shouldDirty: true, shouldValidate: true });
                                    }} />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {(["lat", "lng"] as const).map((axis) => (
                                            <div key={axis} className="flex flex-col gap-1.5">
                                                <label htmlFor={`location-${index}-${axis}`} className="text-sm font-medium">{axis === "lat" ? "Latitude" : "Longitude"}</label>
                                                <input id={`location-${index}-${axis}`} type="number" step="any" {...register(`locations.${index}.${axis}`, { setValueAs: coordinateValue })} className="form-select" />
                                                {locationErrors?.[axis] && <p className="text-sm text-red-600">{locationErrors[axis].message}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {errors.locations?.root?.message && <p className="text-sm text-red-600">{errors.locations.root.message}</p>}
                        <button type="button" onClick={() => append(emptyOfficeLocation())} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium">+ Add Another Location</button>
                        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
                            {isSubmitting ? "Saving…" : `${id ? "Update" : "Create"} Office`}
                        </button>
                    </fieldset>
                </form>
            )}
        </Wrapper>
    );
}
