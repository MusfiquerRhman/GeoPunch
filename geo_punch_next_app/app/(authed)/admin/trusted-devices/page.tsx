"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrapper } from "@/components";

type Status = "pending" | "trusted" | "rejected";
type Decision = "trust" | "reject" | "revoke";
type Device = {
  id: string;
  name: string;
  model: string | null;
  platform: string | null;
  os_version: string | null;
  status: Status;
  version: number;
  requested_at: string;
  last_sign_in_at: string | null;
  employee: { name: string; id_card_no: string | null };
};

const endpoint = "/api/admin/trusted-devices";
const statuses = ["all", "pending", "trusted", "rejected"] as const;
const statusStyle = {
  pending: "bg-amber-100 text-amber-900",
  trusted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const buttonStyle = "rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50";

export default function TrustedDevicesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof statuses)[number]>("all");
  const devicesQuery = useQuery({
    queryKey: ["trusted-devices", "list"],
    queryFn: async (): Promise<{ devices: Device[] }> => {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Couldn’t load trusted devices.");
      return response.json();
    },
    refetchInterval: 20_000,
  });
  const review = useMutation({
    mutationFn: async ({ device, decision }: { device: Device; decision: Decision }) => {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: device.id, version: device.version, decision }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn’t update this device. Try again.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["trusted-devices"] }),
  });

  const devices = devicesQuery.data?.devices ?? [];
  const visible = devices.filter((device) => filter === "all" || device.status === filter);

  return (
    <Wrapper heading="Trusted Devices" scrollable>
      <div className="space-y-4 pb-6">
        <p className="text-sm text-slate-600">The first device is trusted automatically. Review requests from employees who sign in on a new device.</p>
        <div className="flex flex-wrap items-center gap-2" aria-label="Filter devices">
          {statuses.map((status) => (
            <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)}
              className={`${buttonStyle} capitalize ${filter === status ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              {status}
            </button>
          ))}
          <button type="button" onClick={() => void devicesQuery.refetch()} disabled={devicesQuery.isFetching}
            className={`${buttonStyle} ml-auto border-slate-200 text-slate-700 hover:bg-slate-50`}>
            Refresh
          </button>
        </div>
        {review.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{review.error.message}</p>}
        {devicesQuery.isPending ? (
          <p role="status" className="text-sm text-slate-600">Loading devices…</p>
        ) : devicesQuery.isError ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Couldn’t load devices. Select Refresh to try again.</p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
            {filter === "all" ? "No devices have been registered yet." : `No ${filter} devices.`}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Device</th>
                  <th scope="col">Status</th>
                  <th scope="col">Requested</th>
                  <th scope="col">Last sign-in</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{device.employee.name}</p>
                      {device.employee.id_card_no && <p className="text-xs text-slate-500">{device.employee.id_card_no}</p>}
                    </td>
                    <td>
                      <p className="font-semibold text-slate-900">{device.name}</p>
                      <p className="text-xs text-slate-500">
                        {[device.model !== device.name ? device.model : null, [device.platform, device.os_version].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500" title={device.id}>ID {device.id.slice(0, 8)}</p>
                    </td>
                    <td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[device.status]}`}>{device.status}</span></td>
                    <td className="whitespace-nowrap">{dateFormat.format(new Date(device.requested_at))}</td>
                    <td className="whitespace-nowrap">{device.last_sign_in_at ? dateFormat.format(new Date(device.last_sign_in_at)) : "—"}</td>
                    <td>
                      <div className="flex gap-2 whitespace-nowrap">
                        {device.status === "pending" && (
                          <>
                            <button type="button" disabled={review.isPending} onClick={() => review.mutate({ device, decision: "trust" })}
                              className={`${buttonStyle} border-teal-700 bg-teal-700 text-white hover:bg-teal-800`}>Trust</button>
                            <button type="button" disabled={review.isPending} onClick={() => review.mutate({ device, decision: "reject" })}
                              className={`${buttonStyle} border-red-200 text-red-800 hover:bg-red-50`}>Reject</button>
                          </>
                        )}
                        {device.status === "trusted" && (
                          <button type="button" disabled={review.isPending}
                            onClick={() => {
                              if (window.confirm(`Revoke trust for ${device.name}? The employee will need approval to sign in again on this device.`)) {
                                review.mutate({ device, decision: "revoke" });
                              }
                            }}
                            className={`${buttonStyle} border-slate-200 text-slate-700 hover:bg-slate-50`}>Revoke trust</button>
                        )}
                        {device.status === "rejected" && <span className="text-sm text-slate-500">Awaiting resend</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
