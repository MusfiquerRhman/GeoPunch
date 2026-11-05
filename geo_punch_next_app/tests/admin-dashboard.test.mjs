import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { loadTs } from "./load-ts.mjs";

const { dashboardFilters, summarizeDashboard } = loadTs("utils/adminDashboard.ts");
const uuid = (value) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const A = uuid(101), B = uuid(102), DHAKA = uuid(201), GAZIPUR = uuid(202), OTHER = uuid(203);
const date = "2026-11-01";

function fixture() {
    const actor = { id: "admin", is_active: true, is_admin: true, company_id: null };
    const companies = [{ id: A, name: "Company A" }, { id: B, name: "Company B" }];
    const offices = [{ id: DHAKA, name: "Dhaka", company_id: A }, { id: GAZIPUR, name: "Gazipur", company_id: A }, { id: OTHER, name: "Other", company_id: B }];
    const employees = [
        { id: uuid(1), name: "One", id_card_no: "001", company_id: A, is_active: true },
        { id: uuid(2), name: "Two", id_card_no: "002", company_id: A, is_active: true },
        { id: uuid(3), name: "Three", id_card_no: "003", company_id: A, is_active: true },
        { id: uuid(4), name: "Four", id_card_no: "004", company_id: B, is_active: true },
        { id: uuid(5), name: "Inactive", id_card_no: "005", company_id: A, is_active: false },
        { id: uuid(6), name: "Unassigned", id_card_no: null, company_id: null, is_active: true },
    ];
    const punch = (id, employee, time, status, office = DHAKA) => ({
        id: uuid(id), employee_id: employee ? uuid(employee) : null,
        submitted_at: time ? new Date(time) : null, status,
        office_id: office, selfie_url: "/uploads/sample.jpg", notes: null,
    });
    const records = [
        punch(301, 1, "2026-10-31T18:00:00Z", 2), // Dhaka midnight, included.
        punch(302, 1, "2026-11-01T08:00:00Z", 1, GAZIPUR), // Same employee, second punch.
        punch(303, 2, "2026-11-01T09:00:00Z", 0),
        punch(304, 3, "2026-10-31T17:59:59.999Z", 1), // Previous local day.
        punch(305, 4, "2026-11-01T10:00:00Z", 2, OTHER),
        punch(306, 5, "2026-11-01T11:00:00Z", 1), // Inactive employee still needs a decision.
        punch(307, 3, "2026-11-01T18:00:00Z", 1), // Next local day, excluded.
        punch(308, null, "2026-11-01T12:00:00Z", 1),
        punch(309, 3, null, 1),
        punch(310, 3, "2026-10-25T17:59:59.999Z", 1), // Before the seven-day window.
    ];
    const calls = [];
    let failure = false;
    const employee = (id) => employees.find((row) => row.id === id);
    const expandEmployee = (row) => ({ ...row, company: companies.find((item) => item.id === row.company_id) ?? null });
    const matchesPunch = (row, where = {}) => {
        if (where.id && row.id !== where.id) return false;
        if (where.status !== undefined && row.status !== where.status) return false;
        if (where.employee_id?.not === null && row.employee_id === null) return false;
        if (where.submitted_at && (!row.submitted_at || row.submitted_at < where.submitted_at.gte || row.submitted_at >= where.submitted_at.lt)) return false;
        if (where.office_locations && row.office_id !== where.office_locations.is.office_id) return false;
        if (where.employees && employee(row.employee_id)?.company_id !== where.employees.is.company_id) return false;
        return true;
    };
    const matchesEmployee = (row, where = {}) => {
        if (where.is_active !== undefined && row.is_active !== where.is_active) return false;
        if (where.company_id && row.company_id !== where.company_id) return false;
        const relation = where.attendance_record;
        if (relation?.some && !records.some((record) => record.employee_id === row.id && matchesPunch(record, relation.some))) return false;
        if (relation?.none && records.some((record) => record.employee_id === row.id && matchesPunch(record, relation.none))) return false;
        return true;
    };
    const db = {
        employees: {
            async findUnique({ where }) { return where.id === actor.id ? actor : null; },
            async findMany(query) {
                calls.push({ model: "employees", ...query });
                const rows = employees.filter((row) => matchesEmployee(row, query.where)).map(expandEmployee).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
                return rows.slice(query.skip ?? 0, query.take === undefined ? undefined : (query.skip ?? 0) + query.take);
            },
            async count({ where }) { return employees.filter((row) => matchesEmployee(row, where)).length; },
        },
        company: { async findUnique({ where }) { return companies.find((row) => row.id === where.id) ?? null; } },
        offices: { async findUnique({ where }) { return offices.find((row) => row.id === where.id) ?? null; } },
        attendance_record: {
            async findMany(query) {
                calls.push({ model: "attendance", ...query });
                if (failure) throw new Error("Database unavailable");
                const rows = records.filter((row) => matchesPunch(row, query.where)).sort((a, b) => a.submitted_at - b.submitted_at || a.id.localeCompare(b.id));
                return rows.slice(query.skip ?? 0, query.take === undefined ? undefined : (query.skip ?? 0) + query.take).map((row) => ({
                    ...row, employees: employee(row.employee_id) ?? null,
                    office_locations: { offices: offices.find((office) => office.id === row.office_id) ?? null },
                }));
            },
        },
        async $transaction(operation, options) {
            assert.equal(options.isolationLevel, "RepeatableRead");
            return operation(db);
        },
    };
    const mocks = {
        "@/utils/prisma": { db },
        "./jwt": { verifyToken: async (token) => token === "admin" ? { id: actor.id } : null },
    };
    const routes = {
        summary: loadTs("app/api/admin/dashboard/route.ts", mocks),
        employees: loadTs("app/api/admin/dashboard/employees/route.ts", mocks),
        export: loadTs("app/api/admin/dashboard/export/route.ts", mocks),
        checkins: loadTs("app/api/admin/checkin/route.ts", mocks),
    };
    return {
        actor, calls, employees, records,
        fail: () => { failure = true; },
        get: (kind = "summary", query = "date=" + date, token = "admin") => routes[kind].GET(new Request("http://localhost/api/test?" + query, {
            headers: token ? { authorization: "Bearer " + token } : {},
        })),
    };
}

test("dashboard date defaults and seven-day windows use Dhaka days, including midnight and leap dates", () => {
    const filters = dashboardFilters(new URLSearchParams(), new Date("2026-10-31T18:00:00Z"));
    assert.equal(filters.date, date);
    assert.deepEqual(filters.dayWhere.submitted_at, { gte: new Date("2026-10-31T18:00:00Z"), lt: new Date("2026-11-01T18:00:00Z") });
    assert.deepEqual(filters.weekWhere.submitted_at, { gte: new Date("2026-10-25T18:00:00Z"), lt: new Date("2026-11-01T18:00:00Z") });
    assert.doesNotThrow(() => dashboardFilters(new URLSearchParams({ date: "2024-02-29" })));
    for (const query of ["date=", "date=2026-02-29", "date=2026-13-01", "date=bad", "company=invalid", "office=invalid"]) {
        assert.throws(() => dashboardFilters(new URLSearchParams(query)));
    }
});

test("dashboard distinguishes unique active people from punch decisions and reconciles company totals", async () => {
    const app = fixture();
    const response = await app.get();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const data = await response.json();
    assert.deepEqual([data.activeEmployees, data.punchedEmployees, data.noPunchEmployees], [5, 3, 2]);
    assert.deepEqual([data.pendingPunches, data.approvedPunches, data.rejectedPunches], [2, 2, 1]);
    assert.equal(data.trend.length, 7);
    assert.deepEqual(data.trend.slice(-2), [{ date: "2026-10-31", count: 1 }, { date, count: 3 }]);
    assert.deepEqual(data.companies.map(({ name, active, punched }) => [name, active, punched]), [["Company A", 3, 2], ["Company B", 1, 1], ["Unassigned", 1, 0]]);
    assert.equal(data.companies.reduce((sum, row) => sum + row.punched, 0), data.punchedEmployees);
    assert.equal(data.companies.reduce((sum, row) => sum + row.active, 0), data.activeEmployees);
    assert.deepEqual(data.pending.map((row) => row.id), [uuid(302), uuid(306)]);
    assert.equal(data.pending[0].photo, "/api/geo_punch/uploads/sample.jpg");
    assert.equal(data.pending[0].office, "Gazipur");
    assert.equal(app.calls.find((call) => call.take === 4).orderBy[0].submitted_at, "asc");
});

test("office-only filters use its company roster and count only punches tagged with that office", async () => {
    const app = fixture();
    const data = await (await app.get("summary", `date=${date}&office=${GAZIPUR}`)).json();
    assert.equal(data.company, A);
    assert.deepEqual([data.activeEmployees, data.punchedEmployees, data.noPunchEmployees, data.pendingPunches], [3, 1, 2, 1]);
    assert.equal(data.companies.length, 1);
    assert.equal(data.pending[0].id, uuid(302));
    const list = await (await app.get("employees", `date=${date}&office=${GAZIPUR}&view=no-punch`)).json();
    assert.equal(list.total, data.noPunchEmployees);
    assert.deepEqual(list.employees.map((row) => row.id).sort(), [uuid(2), uuid(3)]);
});

test("employee drilldowns match all three metric counts and paginate beyond twenty employees", async () => {
    const app = fixture();
    for (const [view, total] of [["active", 5], ["punched", 3], ["no-punch", 2]]) {
        const response = await app.get("employees", `date=${date}&view=${view}`);
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.total, total);
        assert.equal(data.employees.length, total);
    }
    for (let index = 0; index < 23; index++) app.employees.push({ id: uuid(1000 + index), name: "Employee " + index, company_id: A, is_active: true });
    const pages = [];
    for (const page of [0, 1]) pages.push(await (await app.get("employees", `date=${date}&company=${A}&view=no-punch&page=${page}`)).json());
    assert.deepEqual(pages.map((page) => page.employees.length), [20, 4]);
    assert.equal(pages[0].total, 24);
    assert.equal(new Set(pages.flatMap((page) => page.employees.map((row) => row.id))).size, 24);
});

test("filtered dashboard exports keep the first and last punch on separate rows", async () => {
    const app = fixture();
    const response = await app.get("export", `date=${date}&company=${A}&office=${GAZIPUR}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /spreadsheetml/);
    assert.match(response.headers.get("Content-Disposition"), /2026-11-01_Dhaka.xlsx/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
    const sheet = workbook.worksheets[0];
    assert.equal(sheet.rowCount, 3);
    assert.deepEqual(sheet.getRow(1).values.slice(1), ["User ID", "Punch Date", "Punch Time", "Punch Status"]);
    for (const row of [2, 3]) assert.deepEqual(sheet.getRow(row).values.slice(1), ["001", new Date("2026-11-01T00:00:00Z"), new Date("1899-12-30T14:00:00Z"), "PENDING"]);
});

test("review links respect status, date, company, office and the selected record", async () => {
    const app = fixture();
    const notes = "Client visit\nFloor 2";
    app.records.find((record) => record.id === uuid(302)).notes = notes;
    const query = `date=${date}&company=${A}&office=${GAZIPUR}&status=1&record=${uuid(302)}`;
    const data = await (await app.get("checkins", query)).json();
    assert.deepEqual(data.records.map((record) => record.id), [uuid(302)]);
    assert.equal(app.calls.find((call) => call.model === "attendance").select.notes, true);
    assert.equal(data.records[0].notes, notes);
    const rejected = await (await app.get("checkins", `date=${date}&company=${A}&status=0`)).json();
    assert.deepEqual(rejected.records.map((record) => record.id), [uuid(303)]);
    assert.equal(rejected.records[0].notes, null);
    const outsideScope = await (await app.get("checkins", query.replace(uuid(302), uuid(305)))).json();
    assert.deepEqual(outsideScope.records, []);
    const all = await (await app.get("checkins", "status=1")).json();
    assert.ok(all.records.some((record) => record.id === uuid(304)), "Unfiltered punch management still includes earlier dates");
});

test("all dashboard routes reject non-admin, expired and inactive sessions before querying attendance", async () => {
    const app = fixture();
    for (const kind of ["summary", "employees", "export", "checkins"]) {
        assert.equal((await app.get(kind, undefined, "invalid")).status, 401);
        assert.equal((await app.get(kind, undefined, "")).status, 401);
        app.actor.is_admin = false;
        assert.equal((await app.get(kind)).status, 403);
        app.actor.is_admin = true;
        app.actor.is_active = false;
        assert.equal((await app.get(kind)).status, 401);
        app.actor.is_active = true;
    }
    assert.equal(app.calls.length, 0);
});

test("invalid dates, mismatched or missing companies/offices and invalid drilldowns return JSON errors", async () => {
    const app = fixture();
    for (const kind of ["summary", "employees", "export", "checkins"]) {
        for (const query of ["date=bad", `date=${date}&company=bad`, `date=${date}&company=${uuid(999)}`, `date=${date}&office=${uuid(999)}`, `date=${date}&company=${B}&office=${DHAKA}`]) {
            const response = await app.get(kind, query);
            assert.equal(response.status, 400, kind + " " + query);
            assert.equal(typeof (await response.json()).error, "string");
        }
    }
    for (const query of [`date=${date}&view=unknown`, `date=${date}&page=-1`, `date=${date}&page=0.5`, `date=${date}&page=Infinity`]) {
        assert.equal((await app.get("employees", query)).status, 400);
    }
    assert.equal((await app.get("checkins", `date=${date}&record=bad`)).status, 400);
    assert.equal(app.calls.length, 0);
});

test("empty dashboards return real zero values and database failures are visible errors", async (t) => {
    assert.deepEqual(summarizeDashboard(date, [], []).trend.map((day) => day.count), [0, 0, 0, 0, 0, 0, 0]);
    const app = fixture();
    app.employees.length = 0;
    app.records.length = 0;
    const data = await (await app.get()).json();
    assert.deepEqual([data.activeEmployees, data.punchedEmployees, data.noPunchEmployees, data.pendingPunches], [0, 0, 0, 0]);
    assert.deepEqual(data.companies, []);
    assert.deepEqual(data.pending, []);
    app.fail();
    t.mock.method(console, "error", () => {});
    for (const kind of ["summary", "export", "checkins"]) {
        const response = await app.get(kind);
        assert.equal(response.status, 500);
        assert.match((await response.json()).error, /try again/);
    }
});
