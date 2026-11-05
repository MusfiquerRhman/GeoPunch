"use client";

import dynamic from "next/dynamic";

export type MapPickerProps = {
    coords?: { lat: number; lng: number } | null;
    onSelect?: (coords: { lat: number; lng: number }) => void;
    height?: number | "100%";
    zoom?: number;
};

// Load Leaflet itself only in the browser, including its hooks and marker code.
const LocationMap = dynamic(() => import("./LocationMap"), {
    ssr: false,
    loading: () => <div className="h-full animate-pulse rounded-lg bg-gray-100" aria-label="Loading map" />,
});

export default function MapPicker({ height = 320, coords, ...props }: MapPickerProps) {
    const valid = coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
        && coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180;
    return (
        <div style={{ height }}>
            <LocationMap {...props} coords={valid ? coords : null} />
        </div>
    );
}
