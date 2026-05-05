"use client";

import { formatDateTime } from "@/utils/localDateString";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Employee = {
  id: string;
  name: string;
  id_card_no: string;
};

type PunchRecord = {
  id: string;
  employee: Employee;
  latitude: number;
  longitude: number;
  selfie_url: string;
  status: number;
  submitted_at:  Date;
  address: string;
};

// mock reverse geocode function (replace with real API)
async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );
  const data = await res.json();
  return `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
}

export default function PunchCard({ record }: { record: PunchRecord }) {
    const queryClient = useQueryClient();

    const [location, setLocation] = useState<string>("Loading location...");
    const [openImage, setOpenImage] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const approveCheckIn = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/checkin/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });
            if (!response.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to approve check-in");
            } else {
                queryClient.invalidateQueries({ queryKey: ["checkins"] });
            }
        } catch (error) {
            console.error("Error approving check-in:", error);
            return Response.json({ error: "Failed to approve check-in" }, { status: 500 });
        }
    }

    const rejectCheckIn = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/checkin/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });
            if(!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to reject check-in");
            }
            else {
                queryClient.invalidateQueries({ queryKey: ["checkins"] });
            }
        } catch (error) {
            console.error("Error rejecting check-in:", error);
            return Response.json({ error: "Failed to reject check-in" }, { status: 500 });
        }
    }

  useEffect(() => {
    reverseGeocode(record.latitude, record.longitude).then(setLocation);
  }, [record.latitude, record.longitude]);

  return (
    <div className="flex flex-row max-w-3xl w-full rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="flex-1">
      {/* Header */}
        <div className="p-4 flex items-center gap-4 border-b border-gray-300">
          <img
              src={record.selfie_url}
              alt="selfie"
              onClick={() => setOpenImage(true)}
              className="w-14 h-14 rounded-full object-cover border cursor-pointer hover:scale-105 transition"
            />

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              {record.employee.name}
            </h2>
            <p className="text-sm text-gray-500">
              ID: {record.employee.id_card_no}
            </p>
          </div>

          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              record.status === 2
                ? "bg-green-100 text-green-700"
                : record.status === 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {record.status === 1 ? "Pending" : record.status === 0 ? "Rejected" : "Approved"}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-sm">
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium text-gray-800">{record?.address ?? location}</p>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Latitude</p>
              <p className="font-mono">{record.latitude}</p>
            </div>
            <div>
              <p className="text-gray-500">Longitude</p>
              <p className="font-mono">{record.longitude}</p>
            </div>
          </div>

          <div>
            <p className="text-gray-500">Submitted At</p>
            <p className="text-gray-800 font-mono">
              {formatDateTime(new Date(record.submitted_at))}
            </p>
          </div>

          <div>
              {record.status === 1 && (
                  <div className="text-sm text-gray-500 flex gap-2">
                      <button
                          onClick={() => approveCheckIn(record.id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition"
                      >
                          Approve
                      </button>
                      <button
                          onClick={() => rejectCheckIn(record.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition"
                      >
                          Reject
                      </button>
                  </div>
              )}
              {record.status === 2 && (
                  <div className="text-sm text-gray-500 flex gap-2">
                      <button 
                          onClick={() => approveCheckIn(record.id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition"
                      >
                          Reject
                      </button>
                  </div>
              )}
              {record.status === 0 && (
                  <button
                      onClick={() => approveCheckIn(record.id)}
                      className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition"
                  >
                      Approve
                  </button>
              )}
          </div>
        </div>
      </div>
      <div className="h-full flex-1">
        <div className="w-full h-full">
          <iframe
              width="100%"
              height="100%"
              className="border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                record.longitude - 0.01
              }%2C${record.latitude - 0.01}%2C${record.longitude + 0.01}%2C${
                record.latitude + 0.01
              }&layer=mapnik&marker=${record.latitude}%2C${record.longitude}`}
          />
        </div>
      </div>

            {/* 🔥 IMAGE MODAL */}
      {openImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setOpenImage(false)}
        >
          <div
            className="relative max-w-3xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              onClick={() => setOpenImage(false)}
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full px-3 py-1"
            >
              ✕
            </button>

            <img
              src={record.selfie_url}
              className="w-full max-h-[80vh] object-contain rounded-lg"
              alt="full selfie"
            />
          </div>
        </div>
      )}
    </div>
  );
}