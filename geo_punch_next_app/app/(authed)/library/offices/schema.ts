import { z } from "zod";

export const officeLocationSchema = z.object({
    id: z.uuid("Invalid office location").nullish(),
    address: z.string().trim().min(1, "Address is required"),
    lat: z.number().nullable().pipe(z.number({ error: "Select a latitude on the map or enter it below" }).min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90")),
    lng: z.number().nullable().pipe(z.number({ error: "Select a longitude on the map or enter it below" }).min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180")),
});

export const officeSchema = z.object({
    name: z.string().trim().min(1, "Office name is required").max(100, "Office name must be at most 100 characters long"),
    company_id: z.uuid("Select a company"),
    locations: z.array(officeLocationSchema).min(1, "At least one location is required"),
}).refine((data) => {
    const ids = data.locations.flatMap((location) => location.id ? [location.id] : []);
    return new Set(ids).size === ids.length;
}, { message: "Each office location must appear only once", path: ["locations"] });
