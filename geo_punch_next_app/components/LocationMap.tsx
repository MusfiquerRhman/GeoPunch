"use client";

import { useEffect } from "react";
import { icon } from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { MapPickerProps } from "./LocationSelector";
import { MAP_TILE_URL, MAP_ATTRIBUTION, MAP_MAX_ZOOM } from "@/utils/maps";
import "leaflet/dist/leaflet.css";

const markerIcon = icon({
    iconUrl: "/maps/leaflet/images/marker-icon.png",
    iconRetinaUrl: "/maps/leaflet/images/marker-icon-2x.png",
    shadowUrl: "/maps/leaflet/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41],
});

function Position({ coords, onSelect }: MapPickerProps) {
    const map = useMap();
    const lat = coords?.lat;
    const lng = coords?.lng;
    useEffect(() => {
        if (lat != null && lng != null) map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    useMapEvents({ click: (event) => onSelect?.({ lat: event.latlng.lat, lng: event.latlng.lng }) });
    return coords ? <Marker position={coords} icon={markerIcon} /> : null;
}

export default function LocationMap(props: MapPickerProps) {
    return (
        <MapContainer center={props.coords ?? [23.8103, 90.4125]} zoom={props.zoom ?? 14} style={{ height: props.height ?? 320, width: "100%" }}>
            <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} maxZoom={MAP_MAX_ZOOM} />
            <Position {...props} />
        </MapContainer>
    );
}
