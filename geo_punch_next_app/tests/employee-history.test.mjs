import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const history = loadTs("../geo_punch/utils/attendanceHistory.ts");
const { historyMonthBounds } = loadTs("utils/employeeHistory.ts");
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const punch = (n, submitted_at, status = 2) => ({ id: id(n), submitted_at, status, address: "Dhaka, Bangladesh", latitude: 23.8103, longitude: 90.4125, selfie_url: `/api/geo_punch/uploads/${n}.jpg` });

function fixture(records = []) {
  const calls = [];
  let actor = { id: "employee-a", is_admin: false };
  let ownCursor = true;
  const db = { attendance_record: {
    findMany: async options => { calls.push(options); return records; },
    findFirst: async options => { calls.push(options); return ownCursor ? { id: options.where.id } : null; },
  } };
  const route = loadTs("app/api/geo_punch/history/route.ts", {
    "@/utils/prisma": { db },
    "../../_utils/auth": { getUserFromRequest: async () => actor },
    "../../_utils/attendanceFiles": { protectedSelfieUrl: value => value.replace("/uploads/", "/api/geo_punch/uploads/") },
  });
  return { calls, db, request: query => route.GET(new Request("http://localhost/api/geo_punch/history" + (query || ""))), setActor: value => { actor = value; }, setOwnCursor: value => { ownCursor = value; } };
}

test("Dhaka month and day boundaries include midnight punches and handle leap years and year transitions", () => {
  assert.equal(history.dayKey("2026-10-31T17:59:59.999Z"), "2026-10-31");
  assert.equal(history.dayKey("2026-10-31T18:00:00Z"), "2026-11-01");
  assert.equal(history.dayKey(null), null);
  assert.equal(history.dayKey("invalid"), null);
  assert.deepEqual(historyMonthBounds("2026-11"), { gte: new Date("2026-10-31T18:00:00Z"), lt: new Date("2026-11-30T18:00:00Z") });
  assert.equal(historyMonthBounds("2028-02").lt.toISOString(), "2028-02-29T18:00:00.000Z");
  assert.equal(history.shiftMonth("2026-12", 1), "2027-01");
  assert.equal(history.shiftMonth("2026-01", -1), "2025-12");
});

test("monthly totals count punches rather than days and group every individual status in timestamp order", () => {
  const records = [punch(1, "2026-11-02T09:53:59Z", 1), punch(2, "2026-11-01T03:57:42Z"), punch(3, "2026-11-02T06:31:22Z", 0), punch(4, "2026-11-02T03:02:10Z"), punch(5, "2026-11-01T09:53:59Z"), punch(6, "2026-10-30T09:00:00Z", 0)];
  assert.deepEqual(history.monthlyCounts(records, "2026-11"), { recorded: 5, pending: 1, rejected: 1 });
  const groups = history.groupPunches(records);
  assert.equal(groups["2026-11-01"].length, 2);
  assert.deepEqual(groups["2026-11-02"].map(record => history.punchStatus(record.status).label), ["Approved", "Rejected", "Pending"]);
  assert.equal(history.punchTime(groups["2026-11-01"][0].submitted_at), "9:57 AM");
  assert.equal(history.punchTime(groups["2026-11-01"].at(-1).submitted_at, true), "3:53:59 PM");
});

test("calendar grids align weekdays correctly without losing month-end dates", () => {
  const november = history.calendarDays("2026-11");
  assert.equal(november[0].key, "2026-11-01");
  assert.equal(november.length, 35);
  assert.equal(november.filter(day => day.inMonth).length, 30);
  const august = history.calendarDays("2026-08");
  assert.equal(august.length, 42);
  assert.equal(august[6].key, "2026-08-01");
  assert.equal(history.calendarDays("2028-02").filter(day => day.inMonth).length, 29);
  const one = history.groupPunches([punch(1, "2026-11-02T03:00:00Z")])["2026-11-02"];
  assert.equal(one[0], one.at(-1));
});

test("invalid coordinates cannot open a misleading map and unknown statuses are not labelled rejected", () => {
  assert.equal(history.validCoordinates({ latitude: 0, longitude: 0 }), true);
  for (const coordinates of [{ latitude: 91, longitude: 90 }, { latitude: null, longitude: 90 }, { latitude: NaN, longitude: 90 }, { latitude: 23, longitude: Infinity }]) assert.equal(history.validCoordinates(coordinates), false);
  assert.equal(history.punchStatus(null).label, "Unknown status");
  assert.equal(history.punchStatus(0).label, "Rejected");
  assert.equal(history.coordinateLabel({ latitude: 23.8103, longitude: 90.4125 }), "23.81030, 90.41250");
});

test("punch maps use the saved location, label it correctly, and escape popup text", () => {
  const { locationMapHtml } = loadTs("../geo_punch/components/location-map-html.ts", {
    "../constants/API_URL": { BASE_URL: "https://geopunch.example", getApiUrl: value => "https://geopunch.example/api/" + value },
  });
  const html = locationMapHtml({ latitude: 23.8103, longitude: 90.4125, offices: [], locationLabel: "Punch location</script><script>bad()</script>" });
  assert.match(html, /"latitude":23\.8103,"longitude":90\.4125/);
  assert.match(html, /locationText\.textContent=data\.locationLabel/);
  assert.equal(html.includes("</script><script>bad()"), false);
  assert.match(html, /geopunch\.example\/api\/maps\/tiles/);
});

test("history requires an authenticated active employee before reading any records", async () => {
  const app = fixture();
  app.setActor(null);
  const response = await app.request("?month=2026-11");
  assert.equal(response.status, 401);
  assert.equal(app.calls.length, 0);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("monthly calendar returns every own punch beyond the old 20-record limit, with private photo URLs", async () => {
  const records = Array.from({ length: 75 }, (_, n) => ({ ...punch(n, "2026-11-02T03:00:00Z"), selfie_url: `/uploads/${n}.jpg` }));
  const app = fixture(records);
  const response = await app.request("?month=2026-11&employee_id=someone-else");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.data.length, 75);
  assert.equal(body.data[0].selfie_url, "/api/geo_punch/uploads/0.jpg");
  assert.equal(body.nextCursor, null);
  assert.equal(app.calls[0].take, undefined);
  assert.deepEqual(app.calls[0].where, { employee_id: "employee-a", submitted_at: historyMonthBounds("2026-11") });
  assert.equal(app.calls[0].select.address, true);
});

test("list pagination uses a stable time/ID order and one-record lookahead without losing same-time punches", async () => {
  const app = fixture(Array.from({ length: 51 }, (_, n) => punch(n + 1, "2026-11-02T03:00:00Z")));
  const body = await (await app.request()).json();
  assert.equal(body.data.length, 50);
  assert.equal(body.nextCursor, id(50));
  assert.deepEqual(app.calls[0].orderBy, [{ submitted_at: { sort: "desc", nulls: "last" } }, { id: "desc" }]);
  assert.equal(app.calls[0].where.employee_id, "employee-a");
  assert.equal(app.calls[0].take, 51);
  await app.request(`?cursor=${id(50)}`);
  assert.deepEqual(app.calls[1].where, { id: id(50), employee_id: "employee-a" });
  assert.deepEqual(app.calls[2].cursor, { id: id(50) });
  assert.equal(app.calls[2].skip, 1);
  const last = fixture([punch(100, null)]);
  const lastBody = await (await last.request()).json();
  assert.equal(lastBody.data.length, 1);
  assert.equal(lastBody.nextCursor, null);
});

test("invalid months and cursors cannot query the database; another employee's cursor is rejected", async () => {
  const app = fixture();
  for (const query of ["?month=", "?month=2026-13", "?month=0000-01", "?month=2026-1", "?month=2026-11-01", "?cursor=bad", `?month=2026-11&cursor=${id(1)}`]) assert.equal((await app.request(query)).status, 400);
  assert.equal(app.calls.length, 0);
  app.setOwnCursor(false);
  assert.equal((await app.request(`?cursor=${id(1)}`)).status, 400);
  assert.equal(app.calls.length, 1);
});

test("database failures return a retryable private response", async t => {
  const app = fixture();
  t.mock.method(console, "error", () => {});
  t.mock.method(app.db.attendance_record, "findMany", async () => { throw new Error("private database details"); });
  const response = await app.request("?month=2026-11");
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /try again/);
});

test("employees can reach their mobile history API without gaining web admin access", async () => {
  const { proxy } = loadTs("proxy.ts", { "@/app/api/_utils/jwt": { verifyToken: async () => ({ id: "employee-a", isAdmin: false }) } });
  const check = pathname => proxy({ nextUrl: { pathname }, url: "http://localhost" + pathname, headers: new Headers({ authorization: "Bearer employee-token" }), cookies: { get: () => undefined } });
  assert.equal((await check("/api/geo_punch/history")).headers.get("x-middleware-next"), "1");
  assert.equal((await check("/api/admin/dashboard")).status, 403);
});
