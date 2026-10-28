"use client";

import dynamic from "next/dynamic";

export type MapPickerProps = {
    coords?: { lat: number; lng: number } | null;
    onSelect?: (coords: { lat: number; lng: number }) => void;
    height?: number;
    zoom?: number;
};

// Load Leaflet itself only in the browser, including its hooks and marker code.
const LocationMap = dynamic(() => import("./LocationMap"), {
    ssr: false,
    loading: () => <div className="h-80 animate-pulse rounded-lg bg-gray-100" aria-label="Loading map" />,
});

export default function MapPicker(props: MapPickerProps) {
    const coords = props.coords;
    const valid = coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
        && coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180;
    return <LocationMap {...props} coords={valid ? coords : null} />;
}
