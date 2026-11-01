"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { dashboardQuery, dhakaDate, type DashboardData, type DashboardEmployeeView } from "@/utils/adminDashboard";
import DashboardIcon, { type DashboardIconName } from "./DashboardIcon";
import EmployeeListDialog, { dashboardJson } from "./EmployeeListDialog";

type Options = {
  companies: { id: string; name: string }[];
  offices: { id: string; name: string; company_id: string | null }[];
};
const panelClass = "min-w-0 rounded-xl border border-gray-200/90 bg-white shadow-sm";
const controlClass = "min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:opacity-60";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-50";

function dateLabel(date: string, options: Intl.DateTimeFormatOptions) {
  const value = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(value.getTime()) ? value.toLocaleDateString("en-GB", { ...options, timeZone: "Asia/Dhaka" }) : "Select a valid date";
}
function timeLabel(time: string) {
  return new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" });
}
function Avatar({ name, photo }: { name: string; photo: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 text-sm font-semibold text-teal-800">
    {name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
    {!failed && photo && <Image unoptimized src={photo} alt="" width={40} height={40} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />}
  </span>;
}

function Trend({ data }: { data: DashboardData }) {
  const maximum = Math.max(4, Math.ceil(Math.max(data.activeEmployees, ...data.trend.map((day) => day.count)) / 4) * 4);
  return <section className={`${panelClass} p-5`} aria-labelledby="trend-heading">
    <h2 id="trend-heading" className="text-base font-semibold text-gray-900">Employees with a punch</h2>
    <p className="mt-1 text-xs text-gray-500">Seven days ending {dateLabel(data.date, { day: "numeric", month: "short" })} · Current active employees</p>
    <div className="mt-7 flex gap-3" role="img" aria-label={`Employees with a punch by day: ${data.trend.map((day) => `${day.date}: ${day.count}`).join(", ")}`}>
      <div className="flex h-40 w-7 shrink-0 flex-col justify-between pb-0.5 text-right text-[11px] tabular-nums text-gray-400" aria-hidden="true">{[4, 3, 2, 1, 0].map((tick) => <span key={tick}>{maximum * tick / 4}</span>)}</div>
      <div className="relative min-w-0 flex-1">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between">{[0, 1, 2, 3, 4].map((tick) => <div key={tick} className="border-t border-dashed border-gray-200" />)}</div>
        <div className="relative grid h-40 grid-cols-7 items-end gap-2 sm:gap-4" aria-hidden="true">{data.trend.map((day, index) => <div key={day.date} className="relative mx-auto flex h-full w-full max-w-14 items-end justify-center">
          <div className={`relative w-full rounded-t-sm ${index === 6 ? "bg-teal-700" : "bg-teal-500/60"}`} style={{ height: `${day.count / maximum * 100}%` }}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-gray-700">{day.count}</span>
          </div>
        </div>)}</div>
        <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[10px] text-gray-500 sm:gap-4 sm:text-xs" aria-hidden="true">{data.trend.map((day) => <span key={day.date}>{dateLabel(day.date, { day: "numeric", month: "short" })}</span>)}</div>
      </div>
    </div>
  </section>;
}

export default function AdminDashboard({ initialDate, initialCompany = "", initialOffice = "", today }: {
  initialDate: string; initialCompany?: string; initialOffice?: string; today: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [company, setCompany] = useState(initialCompany);
  const [office, setOffice] = useState(initialOffice);
  const [employeeView, setEmployeeView] = useState<DashboardEmployeeView | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const options = useQuery({
    queryKey: ["attendance-report-options"],
    queryFn: ({ signal }) => dashboardJson<Options>("/api/admin/checkin/report-options", signal),
  });
  const selectedOffice = options.data?.offices.find((item) => item.id === office);
  const effectiveCompany = company || selectedOffice?.company_id || "";
  const offices = (options.data?.offices ?? []).filter((item) => !effectiveCompany || item.company_id === effectiveCompany);
  const params = dashboardQuery(date, effectiveCompany, office);
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-dashboard", date, effectiveCompany, office],
    queryFn: ({ signal }) => dashboardJson<DashboardData>(`/api/admin/dashboard?${params}`, signal),
    enabled: Boolean(date),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
  const scopedCompany = data?.company ?? effectiveCompany;
  const currentDay = date === today;

  function reviewLink(status = 1, record?: string) {
    const query = dashboardQuery(date, scopedCompany, office);
    query.set("status", String(status));
    if (record) query.set("record", record);
    return `/attendance/check-in?${query}`;
  }
  function changeFilters(change: () => void) {
    setEmployeeView(null);
    setExportError(null);
    change();
  }
  async function exportReport() {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch(`/api/admin/dashboard/export?${dashboardQuery(date, scopedCompany, office)}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not download the report. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "geopunch-dashboard.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not download the report.");
    } finally {
      setExporting(false);
    }
  }

  const cards: { label: string; count?: number; subtitle: string; icon: DashboardIconName; color: string; view?: DashboardEmployeeView; href?: string }[] = [
    { label: "Active employees", count: data?.activeEmployees, subtitle: "Current company roster", icon: "users", color: "text-teal-700 bg-teal-50", view: "active" },
    { label: currentDay ? "Punched today" : "Employees with a punch", count: data?.punchedEmployees, subtitle: office ? "At the selected nearest office" : "At least one punch on this date", icon: "check", color: "text-teal-700 bg-teal-50", view: "punched" },
    { label: office ? "No punch at this office" : "No punch recorded", count: data?.noPunchEmployees, subtitle: office ? "Company roster without a punch here" : "Active employees without a punch", icon: "clock", color: "text-amber-700 bg-amber-50", view: "no-punch" },
    { label: "Pending reviews", count: data?.pendingPunches, subtitle: "Punches awaiting a decision", icon: "clipboard", color: "text-amber-700 bg-amber-50", href: reviewLink() },
  ];

  return <div className="h-full min-h-0 overflow-y-auto bg-[#f7f9fb] p-4 sm:p-6 lg:p-7">
    <div className="mx-auto max-w-[1700px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-2"><DashboardIcon name="shield" className="h-4 w-4 text-teal-700" /> Admin workspace <span className="text-gray-300">/</span><span className="font-medium text-gray-800">Dashboard</span></span>
        <button type="button" onClick={() => void refetch()} disabled={isFetching || !date} className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 hover:bg-gray-100 disabled:opacity-60" aria-label="Refresh dashboard"><DashboardIcon name="refresh" className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{isFetching ? "Updating…" : data ? `Updated ${timeLabel(data.updatedAt)}` : "Refresh"}</button>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Attendance dashboard</h1><p className="mt-1.5 text-sm text-gray-500">{dateLabel(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Dhaka time</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportReport()} disabled={exporting || !data || Boolean(error)} className={`${buttonClass} border border-teal-700 bg-white text-teal-800 hover:bg-teal-50`}><DashboardIcon name="download" />{exporting ? "Preparing report…" : "Export daily report"}</button>
          <Link href={reviewLink()} className={`${buttonClass} bg-teal-700 text-white hover:bg-teal-800`}>Review pending{data ? ` (${data.pendingPunches})` : ""}<DashboardIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3" aria-label="Dashboard filters">
        <label className="w-full text-xs font-medium text-gray-500 sm:w-48">Attendance date<input aria-label="Attendance date" type="date" value={date} max={today} onChange={(event) => changeFilters(() => setDate(event.target.value))} className={`${controlClass} mt-1.5`} /></label>
        <label className="w-full min-w-0 text-xs font-medium text-gray-500 sm:w-60">Company<select aria-label="Company" value={effectiveCompany} disabled={options.isPending || options.isError} onChange={(event) => changeFilters(() => { setCompany(event.target.value); setOffice(""); })} className={`${controlClass} mt-1.5`}><option value="">All companies</option>{options.data?.companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="w-full min-w-0 text-xs font-medium text-gray-500 sm:w-60">Nearest office<select aria-label="Nearest office" value={office} disabled={options.isPending || options.isError} onChange={(event) => changeFilters(() => setOffice(event.target.value))} className={`${controlClass} mt-1.5`}><option value="">All offices</option>{offices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button type="button" className="min-h-11 px-1 text-sm font-medium text-teal-800 underline underline-offset-4" onClick={() => changeFilters(() => { setDate(dhakaDate()); setCompany(""); setOffice(""); })}>Reset filters</button>
      </div>
      {office && <p className="text-xs leading-relaxed text-gray-500">Office results use the nearest office recorded with each punch. Employee totals follow company assignment.</p>}
      {options.isError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{options.error.message} <button type="button" onClick={() => void options.refetch()} className="font-medium underline">Retry filters</button></div>}
      {!date && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Select a date to view attendance.</p>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}{data && " Showing the last successful update."} <button type="button" onClick={() => void refetch()} className="font-semibold underline">Retry</button></div>}
      {exportError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{exportError}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Attendance totals" aria-busy={isFetching}>
        {cards.map((card) => {
          const content = <><div className="flex items-start justify-between gap-2"><h2 className="text-sm font-semibold text-gray-800">{card.label}</h2><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.color}`}><DashboardIcon name={card.icon} /></span></div><div className={`mt-1 text-4xl font-semibold tracking-tight tabular-nums ${card.icon === "check" ? "text-teal-800" : card.icon === "clipboard" ? "text-amber-700" : "text-gray-950"}`}>{card.count?.toLocaleString() ?? <span aria-label="Loading total" className="inline-block h-9 w-16 animate-pulse rounded bg-gray-100" />}</div><p className="mt-2 text-xs leading-relaxed text-gray-500">{card.subtitle}</p></>;
          return card.href ? <Link key={card.label} href={card.href} className={`${panelClass} p-5 text-left transition hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-teal-700`}>{content}</Link> : <button key={card.label} type="button" disabled={!data} onClick={() => setEmployeeView(card.view!)} className={`${panelClass} p-5 text-left transition hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-default`}>{content}</button>;
        })}
      </div>

      {isPending && date && !error && <div role="status" className={`${panelClass} flex min-h-48 items-center justify-center gap-3 text-sm text-gray-500`}><DashboardIcon name="refresh" className="h-5 w-5 animate-spin text-teal-700" />Loading attendance overview…</div>}
      {data && <>
        <div className="grid items-start gap-4 xl:grid-cols-3">
          <section className={`${panelClass} overflow-hidden xl:col-span-2`} aria-labelledby="pending-heading">
            <div className="flex items-center justify-between gap-3 p-5"><h2 id="pending-heading" className="flex items-center gap-2 text-base font-semibold text-gray-900">Pending punch reviews<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{data.pendingPunches}</span></h2><Link href={reviewLink()} className="shrink-0 text-xs font-semibold text-teal-800 underline underline-offset-2">View all</Link></div>
            {data.pending.length ? <div className="overflow-x-auto px-3 pb-3"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Employee", "Punch time", "Nearest office", "Status", "Action"].map((title) => <th key={title} scope="col" className="px-3 py-3 font-semibold">{title}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.pending.map((record) => <tr key={record.id}>
              <td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar name={record.name} photo={record.photo} /><div className="max-w-40"><p className="break-words font-medium text-gray-900">{record.name}</p><p className="mt-0.5 text-xs text-gray-500">ID: {record.idCard ?? "Unassigned"}</p></div></div></td>
              <td className="whitespace-nowrap px-3 py-3"><p className="font-medium tabular-nums text-gray-800">{record.time ? timeLabel(record.time) : "Unavailable"}</p><p className="mt-0.5 text-xs text-gray-400">{currentDay ? "Today" : dateLabel(date, { day: "numeric", month: "short" })}</p></td>
              <td className="max-w-40 break-words px-3 py-3 text-gray-600">{record.office ?? "Not recorded"}</td><td className="px-3 py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Pending</span></td>
              <td className="px-3 py-3"><Link href={reviewLink(1, record.id)} aria-label={`Review punch for ${record.name}`} className="inline-flex min-h-9 items-center rounded-md border border-teal-600 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-50">Review</Link></td>
            </tr>)}</tbody></table></div> : <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 pb-7 text-center"><DashboardIcon name="check" className="h-9 w-9 text-teal-600" /><p className="font-medium text-gray-800">No pending punches</p><p className="text-sm text-gray-500">There are no punches awaiting review for these filters.</p></div>}
          </section>
          <section className={`${panelClass} overflow-hidden`} aria-labelledby="attention-heading">
            <h2 id="attention-heading" className="border-b border-gray-100 p-5 text-base font-semibold text-gray-900">Needs attention</h2>
            <div className="divide-y divide-gray-100">{[
              { icon: "clipboard" as const, color: "bg-amber-50 text-amber-700", title: `${data.pendingPunches} pending punches`, subtitle: "Review submitted selfies and locations", href: reviewLink() },
              { icon: "clock" as const, color: "bg-gray-100 text-gray-500", title: `${data.noPunchEmployees} employees with no punch${office ? " here" : ""}`, subtitle: "View the active employee list", view: "no-punch" as const },
              { icon: "rejected" as const, color: "bg-red-50 text-red-600", title: `${data.rejectedPunches} rejected punches`, subtitle: "View rejected records", href: reviewLink(0) },
            ].map((item) => {
              const content = <><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}><DashboardIcon name={item.icon} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-800">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-gray-500">{item.subtitle}</span></span><DashboardIcon name="arrow" className="h-4 w-4 shrink-0 text-gray-400" /></>;
              const style = "flex w-full items-center gap-3 p-5 text-left transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-teal-700";
              return item.href ? <Link key={item.icon} href={item.href} className={style}>{content}</Link> : <button key={item.icon} type="button" onClick={() => setEmployeeView(item.view!)} className={style}>{content}</button>;
            })}</div>
          </section>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-5">
          <div className="min-w-0 xl:col-span-3"><Trend data={data} /></div>
          <section className={`${panelClass} xl:col-span-2`} aria-labelledby="company-heading">
            <h2 id="company-heading" className="px-5 pt-5 text-base font-semibold text-gray-900">{currentDay ? "Today by company" : "Attendance by company"}</h2>
            <div className="max-h-72 overflow-auto p-4"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th scope="col" className="p-2 font-medium">Company</th><th scope="col" className="p-2 text-right font-medium">Punched</th><th scope="col" className="p-2 text-right font-medium">Active</th></tr></thead><tbody className="divide-y divide-gray-100">{data.companies.map((row) => <tr key={row.id ?? "unassigned"}><td className="p-2.5"><span className="block break-words font-medium text-gray-700">{row.name}</span><div role="progressbar" aria-label={`${row.name}: ${row.punched} of ${row.active} employees with a punch`} aria-valuenow={row.punched} aria-valuemin={0} aria-valuemax={row.active || 1} className="mt-1.5 h-1.5 w-24 max-w-full overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${row.active ? row.punched / row.active * 100 : 0}%` }} /></div></td><td className="p-2.5 text-right tabular-nums text-gray-700">{row.punched}</td><td className="p-2.5 text-right tabular-nums text-gray-500">{row.active}</td></tr>)}</tbody><tfoot><tr className="border-t border-gray-200 font-semibold text-gray-900"><th scope="row" className="p-2.5 text-left">Total</th><td className="p-2.5 text-right tabular-nums">{data.punchedEmployees}</td><td className="p-2.5 text-right tabular-nums">{data.activeEmployees}</td></tr></tfoot></table>{!data.companies.length && <p className="px-2 py-4 text-sm text-gray-500">No active employees in this company.</p>}</div>
          </section>
        </div>
        <p className="pb-1 text-xs leading-relaxed text-gray-500">Employee totals use the current active roster. A punch counts as a submission regardless of approval status. No punch does not mean absent.{office ? " No punch here includes employees who may have punched at another office." : ""}</p>
      </>}
      {employeeView && <EmployeeListDialog key={`${date}:${scopedCompany}:${office}:${employeeView}`} date={date} company={scopedCompany} office={office} view={employeeView} onClose={() => setEmployeeView(null)} />}
    </div>
  </div>;
}
