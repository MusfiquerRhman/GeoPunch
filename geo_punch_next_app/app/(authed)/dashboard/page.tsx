import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { dhakaDate } from "@/utils/adminDashboard";

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const scalar = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
  const today = dhakaDate();
  return <AdminDashboard initialDate={scalar(params.date) || today} initialCompany={scalar(params.company)} initialOffice={scalar(params.office)} today={today} />;
}
