import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { loadTs } from "./load-ts.mjs";

const { createDailyAttendanceReport } = loadTs("utils/dailyAttendanceReport.ts");
const { dailyAttendanceReportFilters } = loadTs("utils/attendanceReportFilters.ts");

function punch(employeeId, cardNumber, time, status = 2) {
    return {
        id: `${employeeId}:${time}:${status}`,
        employee_id: employeeId, employees: { id_card_no: cardNumber },
        submitted_at: time ? new Date(time) : null, status,
    };
}

async function readReport(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    assert.equal(workbook.worksheets.length, 1);
    const sheet = workbook.worksheets[0];
    assert.equal(sheet.columnCount, 3);
    assert.deepEqual(sheet.getRow(1).values.slice(1), ["User ID", "Punch Time", "Punch Status"]);
    return sheet;
}

test("Excel puts each user's first and last punch on separate rows by Dhaka day, regardless of input order", async () => {
    const sheet = await readReport(await createDailyAttendanceReport([
        punch("user-a", "00123", "2026-10-29T18:00:00Z", 1),
        punch("user-a", "00123", "2026-10-29T11:30:00Z"),
        punch("user-b", "EMP-2", "2026-10-29T08:00:00Z", 0),
        punch("user-a", "00123", "2026-10-29T06:00:00Z"),
        punch("user-a", "00123", "2026-10-28T18:00:00Z", 0),
        punch("user-a", "00123", "2026-10-29T17:59:59Z", 1),
        punch("user-b", "EMP-2", "2026-10-29T01:00:00Z"),
        punch("user-a", "00123", "2026-10-29T11:30:00Z"),
    ]));

    assert.equal(sheet.rowCount, 7);
    assert.deepEqual(sheet.getRow(2).values.slice(1), [
        "00123", new Date("2026-10-29T00:00:00Z"), "REJECTED",
    ]);
    assert.deepEqual(sheet.getRow(3).values.slice(1), [
        "00123", new Date("2026-10-29T23:59:59Z"), "PENDING",
    ]);
    assert.deepEqual(sheet.getRow(4).values.slice(1), [
        "EMP-2", new Date("2026-10-29T07:00:00Z"), "ACCEPTED",
    ]);
    assert.deepEqual(sheet.getRow(5).values.slice(1), [
        "EMP-2", new Date("2026-10-29T14:00:00Z"), "REJECTED",
    ]);
    for (const row of [6, 7]) assert.deepEqual(sheet.getRow(row).values.slice(1), [
        "00123", new Date("2026-10-30T00:00:00Z"), "PENDING",
    ]);
    assert.equal(sheet.getCell("A2").type, ExcelJS.ValueType.String);
    assert.equal(sheet.getCell("B2").type, ExcelJS.ValueType.Date);
    assert.equal(sheet.getCell("B2").numFmt, '[$-en-US]dd mmm yyyy"   "h:mm:ss AM/PM');
    assert.equal(sheet.getCell("B3").numFmt, sheet.getCell("B2").numFmt);
    assert.equal(sheet.autoFilter, "A1:C7");
});

test("a single punch fills both first and last rows, and users without ID card numbers remain identifiable", async () => {
    const sheet = await readReport(await createDailyAttendanceReport([
        punch("user-without-card", null, "2026-10-29T03:00:00Z", 1),
        punch(null, null, "2026-10-29T04:00:00Z"),
        punch("user-without-time", "EMP-3", null),
    ]));
    assert.equal(sheet.rowCount, 3);
    for (const row of [2, 3]) assert.deepEqual(sheet.getRow(row).values.slice(1), [
        "user-without-card", new Date("2026-10-29T09:00:00Z"), "PENDING",
    ]);
});

test("equal-time punches choose consistent statuses regardless of input order", async () => {
    const records = [
        { ...punch("user", "EMP-1", "2026-10-29T03:00:00Z", 0), id: "last" },
        { ...punch("user", "EMP-1", "2026-10-29T03:00:00Z", 2), id: "first" },
    ];
    for (const input of [records, [...records].reverse()]) {
        const sheet = await readReport(await createDailyAttendanceReport(input));
        assert.equal(sheet.getCell("C2").value, "ACCEPTED");
        assert.equal(sheet.getCell("C3").value, "REJECTED");
    }
});

test("an empty date range still produces a valid Excel file with three headers", async () => {
    const sheet = await readReport(await createDailyAttendanceReport([]));
    assert.equal(sheet.rowCount, 1);
    assert.equal(sheet.autoFilter, "A1:C1");
});

test("report dates require a valid inclusive range and include all statuses from all users", () => {
    const where = dailyAttendanceReportFilters(new URLSearchParams({
        from: "2026-10-29", to: "2026-10-30", status: "0", company: "ignored", office: "ignored",
    }));
    assert.deepEqual(where, {
        submitted_at: { gte: new Date("2026-10-28T18:00:00Z"), lt: new Date("2026-10-30T18:00:00Z") },
        employee_id: { not: null },
    });
    const leapDay = dailyAttendanceReportFilters(new URLSearchParams({ from: "2024-02-29", to: "2024-02-29" }));
    assert.equal(leapDay.submitted_at.lt - leapDay.submitted_at.gte, 86400000);
    for (const values of [{}, { from: "2026-10-29" }, { to: "2026-10-30" },
        { from: " ", to: "2026-10-30" }, { from: "2026-02-29", to: "2026-03-01" },
        { from: "2026-10-31", to: "2026-10-30" }, { from: "2026-10-29", to: "2026-11-31" },
        { from: "2026-1-1", to: "2026-10-30" }, { from: "bad-date", to: "2026-10-30" }]) {
        assert.throws(() => dailyAttendanceReportFilters(new URLSearchParams(values)));
    }
});

function fixture(records = []) {
    const actor = { id: "admin", is_active: true, is_admin: true, company_id: null };
    const calls = [];
    const attendance = {
        async findMany(query) {
            calls.push(query);
            const { where } = query;
            return records.filter((record) => (where.status === undefined || record.status === where.status) && record.employee_id !== null
                && record.submitted_at >= where.submitted_at.gte && record.submitted_at < where.submitted_at.lt);
        },
    };
    const db = { employees: { findUnique: async () => actor }, attendance_record: attendance };
    const auth = loadTs("app/api/_utils/auth.ts", {
        "@/utils/prisma": { db },
        "./jwt": { verifyToken: async (token) => token === "test-admin" ? { id: actor.id } : null },
    });
    const { GET } = loadTs("app/api/admin/checkin/daily-report/route.ts", {
        "@/utils/prisma": { db }, "../../../_utils/auth": auth,
    });
    return {
        actor, calls, attendance,
        get: (query = "from=2026-10-29&to=2026-10-30", token = "test-admin") => GET(new Request(
            "http://localhost/api/admin/checkin/daily-report?" + query,
            { headers: { authorization: "Bearer " + token } },
        )),
    };
}

test("download includes every user's accepted, pending and rejected punches within both dates", async () => {
    const records = Array.from({ length: 30 }, (_, index) => punch("user-" + index, "EMP-" + index, "2026-10-29T03:00:00Z"));
    const app = fixture([
        ...records,
        punch("user-0", "EMP-0", "2026-10-28T18:00:00Z"),
        punch("user-0", "EMP-0", "2026-10-29T17:59:59Z"),
        punch("user-0", "EMP-0", "2026-10-29T18:00:00Z"),
        punch("user-0", "EMP-0", "2026-10-30T17:59:59.999Z"),
        punch("user-0", "EMP-0", "2026-10-28T17:59:59.999Z"),
        punch("user-0", "EMP-0", "2026-10-30T18:00:00Z"),
        punch("pending", "PENDING", "2026-10-29T02:00:00Z", 1),
        punch("rejected", "REJECTED", "2026-10-29T12:00:00Z", 0),
        punch("user-0", "EMP-0", "2026-10-29T17:59:59.500Z", 1),
        punch("user-1", "EMP-1", "2026-10-29T01:00:00Z", 0),
    ]);
    const response = await app.get("from=2026-10-29&to=2026-10-30&status=0&company=ignored");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Content-Disposition"),
        'attachment; filename="geopunch-daily-attendance_2026-10-29_to_2026-10-30_Dhaka.xlsx"');
    assert.equal(app.calls.length, 1);
    assert.equal(app.calls[0].take, undefined);
    assert.equal(app.calls[0].skip, undefined);
    assert.equal(Object.hasOwn(app.calls[0].where, "status"), false);
    assert.equal(app.calls[0].select.id, true);
    assert.equal(app.calls[0].select.status, true);
    const sheet = await readReport(Buffer.from(await response.arrayBuffer()));
    assert.equal(sheet.rowCount, 67);
    assert.deepEqual(sheet.getRow(2).values.slice(1), [
        "EMP-0", new Date("2026-10-29T00:00:00Z"), "ACCEPTED",
    ]);
    assert.deepEqual(sheet.getRow(3).values.slice(1), [
        "EMP-0", new Date("2026-10-29T23:59:59.500Z"), "PENDING",
    ]);
    assert.deepEqual(sheet.getRow(4).values.slice(1), [
        "EMP-1", new Date("2026-10-29T07:00:00Z"), "REJECTED",
    ]);
    assert.deepEqual(sheet.getRow(5).values.slice(1), [
        "EMP-1", new Date("2026-10-29T09:00:00Z"), "ACCEPTED",
    ]);
    for (const row of [62, 63]) assert.deepEqual(sheet.getRow(row).values.slice(1), [
        "PENDING", new Date("2026-10-29T08:00:00Z"), "PENDING",
    ]);
    for (const row of [64, 65]) assert.deepEqual(sheet.getRow(row).values.slice(1), [
        "REJECTED", new Date("2026-10-29T18:00:00Z"), "REJECTED",
    ]);
    assert.deepEqual(sheet.getRow(66).values.slice(1), [
        "EMP-0", new Date("2026-10-30T00:00:00Z"), "ACCEPTED",
    ]);
    assert.deepEqual(sheet.getRow(67).values.slice(1), [
        "EMP-0", new Date("2026-10-30T23:59:59.999Z"), "ACCEPTED",
    ]);
});

test("invalid date ranges return a clear error without querying attendance", async () => {
    const app = fixture();
    for (const query of ["", "from=2026-10-29", "from=2026-10-31&to=2026-10-30", "from=2026-02-30&to=2026-10-30"]) {
        const response = await app.get(query);
        assert.equal(response.status, 400);
        assert.equal(typeof (await response.json()).error, "string");
    }
    assert.equal(app.calls.length, 0);
});

test("daily downloads require an active administrator", async () => {
    const app = fixture();
    assert.equal((await app.get(undefined, "invalid")).status, 401);
    app.actor.is_admin = false;
    assert.equal((await app.get()).status, 403);
    app.actor.is_admin = true;
    app.actor.is_active = false;
    assert.equal((await app.get()).status, 401);
    assert.equal(app.calls.length, 0);
});

test("database failures return a JSON error instead of a broken spreadsheet", async (t) => {
    const app = fixture();
    t.mock.method(console, "error", () => {});
    t.mock.method(app.attendance, "findMany", async () => { throw new Error("Database unavailable"); });
    const response = await app.get();
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /Could not generate/);
});
