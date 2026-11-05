"use client";

import { formatDateTime } from "@/utils/localDateString";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MapPicker from "@/components/LocationSelector";

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
  address: string | null;
  notes: string | null;
  distance: number | null;
  nearest_office_address: string | null;
  nearest_office_name: string | null;
};

export default function PunchCard({ record }: { record: PunchRecord }) {
    const queryClient = useQueryClient();

    const [openImage, setOpenImage] = useState(false);

    const approveCheckIn = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/checkin/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to approve check-in");
            } else {
                queryClient.invalidateQueries({ queryKey: ["checkins"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
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
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            }
        } catch (error) {
            console.error("Error rejecting check-in:", error);
            return Response.json({ error: "Failed to reject check-in" }, { status: 500 });
        }
    }

  return (
    <div className="grid w-full max-w-5xl shrink-0 grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:shadow-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,1.5fr)]">
      <div className="relative h-56 border-b border-gray-200 bg-gray-50 lg:h-auto lg:min-h-64 lg:border-r lg:border-b-0">
        <img
          src={record.selfie_url}
          alt="selfie"
          onClick={() => setOpenImage(true)}
          className="absolute inset-0 h-full w-full object-contain cursor-pointer"
        />
      </div>
      <div className="min-w-0 break-words">
      {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-300 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              {record.employee.name}
            </h2>
            <p className="text-sm text-gray-500">
              ID: {record.employee.id_card_no}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
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
            <p className="text-xs text-gray-500 uppercase tracking-wide font-mono">Client-reported address</p>
            <p className="font-medium text-gray-800">{record.address?.trim() || "No address submitted"}</p>
               <span className="text-xs text-gray-500 uppercase tracking-wide font-mono">
                (LAT:{record.latitude}, LON:{record.longitude})
              </span>
          </div>

          {/* <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Latitude</p>
              <p className="font-mono">{record.latitude}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Longitude</p>
              <p className="font-mono">{record.longitude}</p>
            </div>
          </div> */}

          {record.notes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Punch notes</p>
              <p className="whitespace-pre-wrap wrap-anywhere text-gray-800">{record.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Submitted At</p>
            <p className="font-mono text-gray-800">
              {formatDateTime(new Date(record.submitted_at))}
            </p>
          </div>

          <details className="group rounded-lg border border-gray-200">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden">
              Nearest Office
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 group-open:rotate-180">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="space-y-2 border-t border-gray-200 px-3 py-3">
              <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 text-base font-semibold text-gray-900">
                  {record.nearest_office_name ?? "N/A"}
                </p>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Distance</p>
                  <p className="font-mono font-medium text-gray-900">
                    {record.distance == null ? "N/A" : `${record.distance.toFixed(2)} m`}
                  </p>
                </div>
              </div>
              <p className="leading-snug text-gray-600">
                {record.nearest_office_address ?? "N/A"}
              </p>
            </div>
          </details>

          <div>
              {record.status === 1 && (
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <button
                          onClick={() => approveCheckIn(record.id)}
                          className="min-h-11 rounded-md bg-teal-500 px-4 py-2 text-white transition hover:bg-teal-600"
                      >
                          Approve
                      </button>
                      <button
                          onClick={() => rejectCheckIn(record.id)}
                          className="min-h-11 rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                      >
                          Reject
                      </button>
                  </div>
              )}
              {record.status === 2 && (
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <button 
                          onClick={() => rejectCheckIn(record.id)}
                          className="min-h-11 rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                      >
                          Reject
                      </button>
                  </div>
              )}
              {record.status === 0 && (
                  <button
                      onClick={() => approveCheckIn(record.id)}
                      className="min-h-11 rounded-md bg-teal-500 px-4 py-2 text-white transition hover:bg-teal-600"
                  >
                      Approve
                  </button>
              )}
          </div>
        </div>
      </div>
      <div className="relative h-56 min-w-0 border-t border-gray-200 lg:h-auto lg:min-h-64 lg:border-t-0 lg:border-l">
          <div className="absolute inset-0" aria-label={`Punch location for ${record.employee.name}`}>
              <MapPicker coords={{ lat: record.latitude, lng: record.longitude }} height="100%" zoom={15} />
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
