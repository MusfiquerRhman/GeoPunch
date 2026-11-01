"use client";

import { useState, type FormEvent } from "react";
import { Wrapper } from "@/components";

export default function DailyAttendanceReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClass = "mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:opacity-60";

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!from || !to) {
      setError("Select both From date and To date.");
      return;
    }
    if (from > to) {
      setError("From date must be on or before To date.");
      return;
    }

    setDownloading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/api/admin/checkin/daily-report?${params}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not download the report. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "geopunch-daily-attendance.xlsx";
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
    <Wrapper heading="Daily Attendance Report" scrollable>
      <form onSubmit={download} className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            From date
            <input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} max={to || undefined} disabled={downloading} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-gray-700">
            To date
            <input type="date" required value={to} onChange={(event) => setTo(event.target.value)} min={from || undefined} disabled={downloading} className={inputClass} />
          </label>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div className="mt-6">
          <button type="submit" disabled={downloading} aria-busy={downloading} className="rounded-lg border border-teal-700 bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60">
            {downloading ? "Preparing report…" : "Download Excel report"}
          </button>
        </div>
      </form>
    </Wrapper>
  );
}
