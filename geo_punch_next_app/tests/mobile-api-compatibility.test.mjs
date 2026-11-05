import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import * as jose from "jose";
import { NextRequest } from "next/server.js";
import { loadTs } from "./load-ts.mjs";

const employeeId = "00000000-0000-4000-8000-000000000001";
const otherEmployeeId = "00000000-0000-4000-8000-000000000002";
const companyId = "00000000-0000-4000-8000-000000000003";
const officeId = "00000000-0000-4000-8000-000000000004";
const image = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const recordId = index => `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`;

function fixture(t) {
  const previous = process.env.JWT_SECRET;
  const secret = "legacy-mobile-api-compatibility-test-secret-32-bytes";
  process.env.JWT_SECRET = secret;
  t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
  const employee = {
    id: employeeId, company_id: companyId, name: "Employee", email: "employee@example.test",
    id_card_no: "31", phone_no: "01000000000", is_active: true, is_admin: false,
    password: null, hashed_password: bcrypt.hashSync("existing-password", 4),
    departments: { department_name: "Operations" }, designations: { designations: "Officer" },
  };
  const records = Array.from({ length: 25 }, (_, index) => ({
    id: recordId(index), employee_id: employeeId, selfie_url: index === 0 ? "/uploads/legacy-selfie.jpg" : `/api/geo_punch/uploads/selfie-${index}.jpg`,
    submitted_at: new Date(Date.parse("2026-11-02T10:00:00Z") - index * 60_000),
    latitude: 23.81, longitude: 90.41, address: index === 0 ? null : "Dhaka, Bangladesh", notes: null, status: [1, 2, 0][index % 3],
  }));
  records.push({ ...records[0], id: recordId(90), employee_id: otherEmployeeId, selfie_url: "/api/geo_punch/uploads/another-employee.jpg" });
  const files = new Map([[path.join(process.cwd(), "public", "uploads", "legacy-selfie.jpg"), image]]);
  const written = [];
  const selectFields = (record, select) => Object.fromEntries(Object.keys(select).map(key => [key, record[key]]));
  const db = {
    employees: { findUnique: async ({ where }) => where.id === employeeId || where.id_card_no === "31" ? employee : null },
    offices: { findMany: async ({ where }) => {
      assert.equal(where.company_id, companyId);
      return [{ name: "Head office", office_locations: [{ id: officeId, address: "Dhaka office", latitude: 23.81, longitude: 90.41 }] }];
    } },
    attendance_record: {
      findMany: async ({ where, select, take }) => {
        assert.equal(where.employee_id, employeeId);
        const own = records.filter(record => record.employee_id === where.employee_id && (!where.submitted_at || (record.submitted_at >= where.submitted_at.gte && record.submitted_at < where.submitted_at.lt)))
          .sort((a, b) => b.submitted_at - a.submitted_at || b.id.localeCompare(a.id));
        return (take === undefined ? own : own.slice(0, take)).map(record => selectFields(record, select));
      },
      findFirst: async ({ where }) => records.find(record => where.OR ? where.OR.some(filter => filter.selfie_url === record.selfie_url) : record.id === where.id && record.employee_id === where.employee_id) ?? null,
      create: async ({ data }) => {
        const record = { ...data, id: recordId(99), status: 1, submitted_at: new Date("2026-11-02T10:30:00Z") };
        written.push(record); records.push(record); return record;
      },
    },
  };
  const mocks = {
    jose,
    "@/utils/prisma": { db },
    "../../../_utils/cookies": { isAuthCookieSecure: () => false },
    "fs/promises": {
      mkdir: async () => {},
      writeFile: async (filename, bytes) => { files.set(filename, bytes); },
      unlink: async filename => { files.delete(filename); },
      readFile: async filename => { if (!files.has(filename)) throw new Error("Missing fixture photo"); return files.get(filename); },
    },
  };
  const cache = new Map();
  const load = file => loadTs(file, mocks, cache);
  const { proxy } = load("proxy.ts");
  const routes = new Map([
    ["/api/auth/geo_punch/login", load("app/api/auth/geo_punch/login/route.ts")],
    ["/api/geo_punch/record", load("app/api/geo_punch/record/route.ts")],
    ["/api/geo_punch/record/with-notes", load("app/api/geo_punch/record/with-notes/route.ts")],
    ["/api/geo_punch/users", load("app/api/geo_punch/users/route.ts")],
    ["/api/geo_punch/get_offices", load("app/api/geo_punch/get_offices/route.ts")],
    ["/api/geo_punch/get_distance", load("app/api/geo_punch/get_distance/route.ts")],
    ["/api/geo_punch/history", load("app/api/geo_punch/history/route.ts")],
  ]);
  const uploads = load("app/api/geo_punch/uploads/[filename]/route.ts");
  // Previously installed clients keep using their original HS256 bearer tokens.
  const oldToken = jsonwebtoken.sign({ id: employeeId, isAdmin: false, id_card_no: "31" }, secret, { expiresIn: "2h" });
  async function request(url, options = {}, authenticated = true) {
    const headers = new Headers(options.headers);
    if (authenticated) headers.set("Authorization", `Bearer ${oldToken}`);
    const req = new NextRequest("http://localhost" + url, { ...options, headers });
    const gate = await proxy(req);
    if (gate.headers.get("x-middleware-next") !== "1") return gate;
    const route = routes.get(req.nextUrl.pathname);
    if (route) return route[req.method](req);
    if (req.nextUrl.pathname.startsWith("/api/geo_punch/uploads/")) return uploads.GET(req, { params: Promise.resolve({ filename: req.nextUrl.pathname.split("/").at(-1) }) });
    return new Response(null, { status: 404 });
  }
  return { request, oldToken, written };
}

test("legacy mobile login keeps ID/password inputs and top-level token/user output without a version header", async t => {
  const app = fixture(t);
  const response = await app.request("/api/auth/geo_punch/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_card_no: "31", password: "existing-password" }),
  }, false);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(typeof body.token, "string");
  assert.deepEqual(body.user, { id: employeeId, name: "Employee", email: "employee@example.test", isAdmin: false, id_card_no: "31", phone_no: "01000000000", departments: "Operations", designations: "Officer" });
  const claims = jsonwebtoken.verify(body.token, process.env.JWT_SECRET);
  assert.equal(claims.exp - claims.iat, 604800);
});

test("legacy history keeps its latest-20 success/data response and numeric statuses alongside the new monthly API", async t => {
  const app = fixture(t);
  const response = await app.request("/api/geo_punch/record");
  assert.equal(response.status, 200);
  const old = await response.json();
  assert.deepEqual(Object.keys(old).sort(), ["data", "success"]);
  assert.equal(old.success, true);
  assert.equal(old.data.length, 20);
  assert.deepEqual(Object.keys(old.data[0]).sort(), ["address", "id", "latitude", "longitude", "selfie_url", "status", "submitted_at"]);
  assert.deepEqual(old.data.map(record => record.id), Array.from({ length: 20 }, (_, index) => recordId(index)));
  assert(old.data.every(record => typeof record.status === "number" && typeof record.submitted_at === "string"));
  assert.equal(old.data[0].selfie_url, "/api/geo_punch/uploads/legacy-selfie.jpg");
  const current = await (await app.request("/api/geo_punch/history?month=2026-11")).json();
  assert.equal(current.data.length, 25);
  assert.equal(current.nextCursor, null);
  assert.deepEqual((await (await app.request("/api/geo_punch/record")).json()).data, old.data);
});

test("legacy multipart punch submissions still work without the newer optional address field", async t => {
  const app = fixture(t);
  const body = new FormData();
  body.append("photo", new File([image], "old-app-selfie.jpg", { type: "image/jpeg" }));
  body.append("latitude", "0"); body.append("longitude", "0");
  const response = await app.request("/api/geo_punch/record", { method: "POST", body });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(app.written.length, 1);
  assert.equal(app.written[0].address, null);
  assert.equal(app.written[0].notes, null);
  assert.equal(app.written[0].employee_id, employeeId);
  const latest = (await (await app.request("/api/geo_punch/record")).json()).data[0];
  assert.equal(latest.id, app.written[0].id);
  assert.equal(latest.status, 1);
  const photo = await app.request(latest.selfie_url);
  assert.equal(photo.status, 200);
  assert.deepEqual(Buffer.from(await photo.arrayBuffer()), image);
});

test("punch notes round-trip as multiline text in list and calendar history", async t => {
  const app = fixture(t);
  const body = new FormData();
  const notes = "Client visit in ঢাকা\n  Floor 2 <east>";
  body.append("photo", new File([image], "selfie.jpg", { type: "image/jpeg" }));
  body.append("latitude", "23.81");
  body.append("longitude", "90.41");
  body.append("notes", notes);

  const response = await app.request("/api/geo_punch/record/with-notes", { method: "POST", body });
  assert.equal(response.status, 201);
  assert.equal(app.written[0].notes, notes);
  for (const query of ["", "?month=2026-11"]) {
    const history = await app.request(`/api/geo_punch/history${query}`);
    assert.equal(history.status, 200);
    const { data } = await history.json();
    assert.equal(data[0].id, app.written[0].id);
    assert.equal(data[0].notes, notes);
    assert.equal(data[1].notes, null);
  }
});

test("invalid punch notes are rejected before a punch is saved", async t => {
  const app = fixture(t);
  const body = new FormData();
  body.append("photo", new File([image], "selfie.jpg", { type: "image/jpeg" }));
  body.append("latitude", "23.81");
  body.append("longitude", "90.41");
  for (const invalid of ["a".repeat(2001), "contains\0null", new File(["text"], "notes.txt")]) {
    body.set("notes", invalid);
    const response = await app.request("/api/geo_punch/record", { method: "POST", body });
    assert.equal(response.status, 400);
  }
  assert.equal(app.written.length, 0);
});

test("the notes endpoint rejects missing and whitespace-only text before saving a punch", async t => {
  const app = fixture(t);
  const body = new FormData();
  body.append("photo", new File([image], "selfie.jpg", { type: "image/jpeg" }));
  body.append("latitude", "23.81");
  body.append("longitude", "90.41");

  const path = "/api/geo_punch/record/with-notes";
  const missing = await app.request(path, { method: "POST", body });
  assert.equal(missing.status, 400);
  assert.match((await missing.json()).error, /enter punch notes/i);

  body.set("notes", "  \n ");
  const blank = await app.request(path, { method: "POST", body });
  assert.equal(blank.status, 400);
  assert.equal(app.written.length, 0);
});

test("legacy profile, office and distance endpoints keep the fields older screens read", async t => {
  const app = fixture(t);
  const profile = await app.request("/api/geo_punch/users");
  assert.equal(profile.status, 200);
  assert.deepEqual(await profile.json(), { success: true, data: { name: "Employee", email: "employee@example.test", id_card_no: "31", department: "Operations", designation: "Officer", phone_no: "01000000000" } });
  const offices = await app.request("/api/geo_punch/get_offices");
  assert.equal(offices.status, 200);
  assert.deepEqual(await offices.json(), { success: true, offices: [{ id: officeId, name: "Head office", address: "Dhaka office", latitude: 23.81, longitude: 90.41 }] });
  const distance = await app.request("/api/geo_punch/get_distance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: 23.81, longitude: 90.41 }) });
  assert.equal(distance.status, 200);
  assert.deepEqual(await distance.json(), { success: true, nearest_office: { distance: 0, office_address: "Dhaka office", office_name: "Head office", office_location_id: officeId } });
});

test("existing bearer tokens still load legacy selfies while other employees' photos stay protected", async t => {
  const app = fixture(t);
  const photo = await app.request("/api/geo_punch/uploads/legacy-selfie.jpg");
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get("Content-Type"), "image/jpeg");
  assert.match(photo.headers.get("Cache-Control"), /private/);
  assert.deepEqual(Buffer.from(await photo.arrayBuffer()), image);
  assert.equal((await app.request("/api/geo_punch/uploads/another-employee.jpg")).status, 404);
  for (const endpoint of ["/api/geo_punch/record", "/api/geo_punch/users", "/api/geo_punch/get_offices", "/api/geo_punch/uploads/legacy-selfie.jpg"]) assert.equal((await app.request(endpoint, {}, false)).status, 401);
});
