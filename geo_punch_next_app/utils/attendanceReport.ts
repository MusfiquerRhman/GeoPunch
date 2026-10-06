import ExcelJS from "exceljs";

export function attendanceReportFilename(downloadedAt = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).formatToParts(downloadedAt);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `geopunch-attendance_${part("year")}-${part("month")}-${part("day")}_${part("hour")}-${part("minute")}-${part("second")}-${part("dayPeriod")?.toUpperCase()}_Dhaka.xlsx`;
}

type ReportRecord = {
  submitted_at: Date | null;
  address: string | null;
  latitude: number;
  longitude: number;
  status: number | null;
  employees: {
    name: string;
    designations: { designations: string } | null;
    departments: { department_name: string } | null;
  } | null;
  office_locations: {
    address: string | null;
    latitude: number;
    longitude: number;
    offices: { name: string } | null;
  } | null;
};

export async function createAttendanceReport(records: ReportRecord[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GeoPunch";
  const sheet = workbook.addWorksheet("Attendance", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Designation", key: "designation", width: 24 },
    { header: "Department", key: "department", width: 24 },
    { header: "Location", key: "location", width: 52 },
    { header: "Status", key: "status", width: 16 },
    { header: "Nearest office name", key: "office", width: 30 },
    { header: "Nearest office location", key: "officeLocation", width: 52 },
    { header: "Submitted at (Asia/Dhaka)", key: "submitted", width: 32 },
  ];
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "medium", hour12: true,
  });
  for (const record of records) {
    const office = record.office_locations;
    sheet.addRow({
      name: record.employees?.name ?? "Unknown employee",
      designation: record.employees?.designations?.designations ?? "Not assigned",
      department: record.employees?.departments?.department_name ?? "Not assigned",
      location: record.address || `${record.latitude}, ${record.longitude}`,
      status: record.status === 0 ? "Rejected" : record.status === 1 ? "Pending" : record.status === 2 ? "Approved" : "Unknown",
      office: office?.offices?.name ?? "Not assigned",
      officeLocation: office ? office.address || `${office.latitude}, ${office.longitude}` : "Not assigned",
      submitted: record.submitted_at ? dateFormatter.format(record.submitted_at).replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase()) : "Unknown",
    });
  }
  sheet.autoFilter = { from: "A1", to: `H${Math.max(1, sheet.rowCount)}` };
  sheet.eachRow((row, index) => {
    row.height = index === 1 ? 28 : 24;
    row.alignment = { vertical: "middle", wrapText: true };
    row.font = { name: "Calibri", size: 11, color: { argb: "FF263632" } };
    if (index === 1) {
      row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    }
  });
  return workbook.xlsx.writeBuffer();
}
