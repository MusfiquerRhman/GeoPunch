import type { z } from "zod";
import type { officeSchema } from "./schema";

export type OfficeInput = z.input<typeof officeSchema>;
export type OfficeValues = z.output<typeof officeSchema>;
export type OfficeDetails = {
    id: string;
    name: string;
    company_id: string | null;
    office_locations: { id: string; address: string | null; latitude: number; longitude: number }[];
};

export const emptyOfficeLocation = () => ({ id: null, address: "", lat: null, lng: null });
export const emptyOfficeValues = (): OfficeInput => ({ name: "", company_id: "", locations: [emptyOfficeLocation()] });

export function coordinateValue(value: unknown): number | null {
    return value === "" || value == null ? null : Number(value);
}

export function officeFormValues(office: OfficeDetails): OfficeInput {
    return {
        name: office.name,
        company_id: office.company_id ?? "",
        locations: office.office_locations.length ? office.office_locations.map((location) => ({
            id: location.id, address: location.address ?? "", lat: location.latitude, lng: location.longitude,
        })) : [emptyOfficeLocation()],
    };
}
