"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Dynamically import map components (NO SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

type LatLng = {
  lat: number;
  lng: number;
};

function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLng | null;
  setPosition: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e: any) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position ? <Marker position={position} /> : null;
}

function RecenterMap({ coords }: { coords: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (coords?.lat != null && coords?.lng != null) {
      map.setView([coords.lat, coords.lng], 15);
    }
  }, [coords, map]);

  return null;
}

export default function MapPicker({
  onSelect,
  coords,
}: {
  onSelect?: (coords: LatLng) => void;
  coords?: LatLng | null;
}) {
  const [position, setPosition] = useState<LatLng | null>(null);

  // 🔥 Fix Leaflet icon issue (client only)
  useEffect(() => {
    const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const handleSetPosition = (pos: LatLng) => {
    setPosition(pos);
    onSelect?.(pos);
  };

  useEffect(() => {
    if (coords?.lat != null && coords?.lng != null) {
      setPosition(coords);
    }
  }, [coords]);

  return (
    <div className="w-full">
      <MapContainer
        center={[23.8103, 90.4125]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap coords={position} />

        <LocationMarker
          position={position}
          setPosition={handleSetPosition}
        />
      </MapContainer>
    </div>
  );
}