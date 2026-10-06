"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wrapper } from "@/components";

type ReportOptions = {
  companies: { id: string; name: string }[];
  offices: { id: string; name: string; company_id: string | null; company: { name: string } | null }[];
};

export default function AttendanceHistoryPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState("");
  const [office, setOffice] = useState("");
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = useQuery({
    queryKey: ["attendance-report-options"],
    queryFn: async (): Promise<ReportOptions> => {
      const response = await fetch("/api/admin/checkin/report-options");
      if (!response.ok) throw new Error("Could not load companies and offices.");
      return response.json();
    },
  });
  const offices = (options.data?.offices ?? []).filter((item) => !company || item.company_id === company);
  const inputClass = "mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900";

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (from && to && from > to) {
      setError("From date must be on or before To date.");
      return;
    }
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries({ from, to, company, office, status })) {
        if (value) params.set(key, value);
      }
      const response = await fetch(`/api/admin/checkin/export?${params}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not download the report. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "geopunch-attendance.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not download the report.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Wrapper heading="Attendance History">
      <form onSubmit={download} className="max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Excel attendance report</h2>
        <p className="mt-1 text-sm text-gray-500">Choose any filters, or leave them blank to include all records. Dates use Dhaka time and include both selected days.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">From date
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} max={to || undefined} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-gray-700">To date
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} min={from || undefined} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-gray-700">Company
            <select value={company} disabled={options.isPending} onChange={(event) => { setCompany(event.target.value); setOffice(""); }} className={inputClass}>
              <option value="">All companies</option>
              {options.data?.companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">Nearest office
            <select value={office} disabled={options.isPending} onChange={(event) => setOffice(event.target.value)} className={inputClass}>
              <option value="">All offices</option>
              {offices.map((item) => <option key={item.id} value={item.id}>{item.name}{item.company ? ` — ${item.company.name}` : ""}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">All statuses</option>
              <option value="1">Pending</option>
              <option value="2">Approved</option>
              <option value="0">Rejected</option>
            </select>
          </label>
        </div>
        {options.isError && <p role="alert" className="mt-4 text-sm text-red-700">{options.error.message} <button type="button" className="underline" onClick={() => void options.refetch()}>Retry</button></p>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={downloading} aria-busy={downloading} className="rounded-lg border border-teal-700 bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60">
            {downloading ? "Preparing report…" : "Download Excel report"}
          </button>
          <button type="button" disabled={downloading} onClick={() => { setFrom(""); setTo(""); setCompany(""); setOffice(""); setStatus(""); setError(null); }} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear filters</button>
        </div>
      </form>
    </Wrapper>
  );
}
