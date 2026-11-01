"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { dashboardQuery, type DashboardEmployeeList, type DashboardEmployeeView } from "@/utils/adminDashboard";
import DashboardIcon from "./DashboardIcon";

export async function dashboardJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your admin session has expired. Please sign in again.");
    if (response.status === 403) throw new Error("Only administrators can view this dashboard.");
    throw new Error(body?.error ?? "Could not load dashboard data. Please try again.");
  }
  if (!body || typeof body !== "object") throw new Error("The server returned an invalid response. Please try again.");
  return body as T;
}

export default function EmployeeListDialog({ date, company, office, view, onClose }: {
  date: string; company: string; office: string; view: DashboardEmployeeView; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(0);
  const params = dashboardQuery(date, company, office);
  params.set("view", view);
  params.set("page", String(page));
  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-employees", date, company, office, view, page],
    queryFn: ({ signal }) => dashboardJson<DashboardEmployeeList>(`/api/admin/dashboard/employees?${params}`, signal),
    staleTime: 0,
  });
  useEffect(() => { if (!ref.current?.open) ref.current?.showModal(); }, []);
  const title = view === "active" ? "Active employees" : view === "punched" ? "Employees with a punch" : office ? "No punch at this office" : "Employees without a punch";

  return (
    <dialog ref={ref} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="employee-list-title" className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-gray-950/40">
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div><h2 id="employee-list-title" className="text-lg font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{date} · Dhaka time · Current active roster</p></div>
          <button type="button" onClick={onClose} aria-label="Close employee list" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-teal-700"><DashboardIcon name="close" /></button>
        </div>
        <div className="min-h-32 overflow-y-auto p-5" aria-busy={isFetching}>
          {isPending && <p role="status" className="py-8 text-center text-sm text-gray-500">Loading employees…</p>}
          {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error.message} <button type="button" onClick={() => void refetch()} className="underline">Retry</button></div>}
          {data && <><p className="mb-3 text-sm text-gray-500">{data.total} {data.total === 1 ? "employee" : "employees"}</p>
            {data.employees.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No employees to show.</p> : <ul className="divide-y divide-gray-100">{data.employees.map((employee) => <li key={employee.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="break-words font-medium text-gray-900">{employee.name}</p><p className="text-sm text-gray-500">{employee.id_card_no ?? "No ID card"} · {employee.company?.name ?? "Unassigned"}</p></div>
              <Link href={`/admin/users/edit/${employee.id}`} className="shrink-0 rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50">View employee</Link>
            </li>)}</ul>}
          </>}
        </div>
        {data && data.total > data.pageSize && <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm">
          <button type="button" disabled={page === 0 || isFetching} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button>
          <span className="text-gray-500">Page {page + 1} of {Math.ceil(data.total / data.pageSize)}</span>
          <button type="button" disabled={(page + 1) * data.pageSize >= data.total || isFetching} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button>
        </div>}
      </div>
    </dialog>
  );
}
