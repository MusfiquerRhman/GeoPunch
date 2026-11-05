import ExcelJS from "exceljs";

type DailyAttendanceRecord = {
  id: string;
  employee_id: string | null;
  submitted_at: Date | null;
  status: number | null;
  employees: { id_card_no: string | null } | null;
};

const dhakaOffset = 6 * 60 * 60 * 1000;

type Punch = { id: string; time: Date; status: number | null };

function comparePunches(a: Punch, b: Punch) {
  // IDs make the first/last selection stable when timestamps are identical.
  return a.time.getTime() - b.time.getTime() || a.id.localeCompare(b.id);
}

function punchStatus(status: number | null) {
  return status === 2 ? "ACCEPTED" : status === 0 ? "REJECTED" : status === 1 ? "PENDING" : "UNKNOWN";
}

export async function createDailyAttendanceReport(records: DailyAttendanceRecord[]) {
  const days = new Map<string, { day: string; userId: string; inPunch: Punch; outPunch: Punch }>();
  for (const record of records) {
    if (!record.employee_id || !record.submitted_at) continue;

    const day = new Date(record.submitted_at.getTime() + dhakaOffset).toISOString().slice(0, 10);
    const key = `${record.employee_id}:${day}`;
    const punch = { id: record.id, time: record.submitted_at, status: record.status };
    const existing = days.get(key);
    if (existing) {
      if (comparePunches(punch, existing.inPunch) < 0) existing.inPunch = punch;
      if (comparePunches(punch, existing.outPunch) > 0) existing.outPunch = punch;
    } else {
      days.set(key, {
        day,
        userId: record.employees?.id_card_no || record.employee_id,
        inPunch: punch,
        outPunch: punch,
      });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GeoPunch";
  workbook.subject = "First and last punch per user per day with acceptance status, in Asia/Dhaka";
  const sheet = workbook.addWorksheet("Daily Attendance", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "User ID", key: "userId", width: 40 },
    { header: "Punch Date", key: "punchDate", width: 18, style: { numFmt: "[$-en-US]dd mmm yyyy" } },
    { header: "Punch Time", key: "punchTime", width: 20, style: { numFmt: "[$-en-US]h:mm:ss AM/PM" } },
    { header: "Punch Status", key: "punchStatus", width: 20 },
  ];
  const rows = [...days.values()].sort((a, b) =>
    a.day.localeCompare(b.day) || a.userId.localeCompare(b.userId, "en", { numeric: true }),
  );
  for (const row of rows) {
    const punchDate = new Date(`${row.day}T00:00:00.000Z`);
    for (const punch of [row.inPunch, row.outPunch]) {
      // Excel stores timezone-free dates and times as fractions of a day.
      const localTime = new Date(punch.time.getTime() + dhakaOffset);
      sheet.addRow({
        userId: row.userId,
        punchDate,
        punchTime: (localTime.getTime() - punchDate.getTime()) / (24 * 60 * 60 * 1000),
        punchStatus: punchStatus(punch.status),
      });
    }
  }

  sheet.autoFilter = { from: "A1", to: `D${sheet.rowCount}` };
  sheet.eachRow((row, index) => {
    row.height = index === 1 ? 28 : 24;
    row.alignment = { vertical: "middle" };
    row.font = { name: "Calibri", size: 11, color: { argb: "FF263632" } };
    if (index === 1) {
      row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    }
  });
  return workbook.xlsx.writeBuffer();
}
