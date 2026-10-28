import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { loadTs } from "./load-ts.mjs";

const companyId = "00000000-0000-4000-8000-000000000010";
const context = (id) => ({ params: Promise.resolve({ id }) });
const request = (method, data, token = "admin") => new Request("http://localhost/api/test", {
    method, headers: { authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(data) }),
});

function fixture() {
    let state = { company: [{ id: companyId, name: "Company" }], departments: [], designations: [], offices: [], locations: [], employees: [] };
    const actor = { id: "admin", is_active: true, is_admin: true, company_id: null };
    const db = {};
    for (const model of ["company", "departments", "designations"]) {
        db[model] = {
            async create({ data }) {
                const field = model === "departments" ? "department_name" : model === "designations" ? "designations" : "name";
                if (model !== "company" && state[model].some((row) => row[field] === data[field])) throw Object.assign(new Error("duplicate"), { code: "P2002" });
                const row = { id: randomUUID(), ...data };
                state[model].push(row);
                return { ...row };
            },
            async update({ where, data }) {
                const row = state[model].find((item) => item.id === where.id);
                if (!row) throw new Error("Requested record does not exist");
                Object.assign(row, data);
                return { ...row };
            },
            async findUnique({ where }) { return state[model].find((row) => row.id === where.id) ?? null; },
        };
    }
    const companyExists = (id) => {
        if (!state.company.some((company) => company.id === id)) throw new Error("Related company not found");
    };
    const officeDetails = (id) => {
        const office = state.offices.find((office) => office.id === id);
        if (!office) return null;
        return { ...office, office_locations: state.locations.filter((location) => location.office_id === id).map((location) => ({ id: location.id, address: location.address, latitude: location.latitude, longitude: location.longitude })) };
    };
    db.offices = {
        async create({ data }) {
            companyExists(data.company_id);
            const office = { id: randomUUID(), name: data.name, company_id: data.company_id };
            state.offices.push(office);
            for (const location of data.office_locations.create) state.locations.push({ id: randomUUID(), ...location, office_id: office.id, references: 0 });
            return officeDetails(office.id);
        },
        async update({ where, data }) {
            companyExists(data.company_id);
            const office = state.offices.find((office) => office.id === where.id);
            if (!office) throw new Error("Requested record does not exist");
            Object.assign(office, data);
            return { ...office };
        },
        async findUnique({ where }) { return officeDetails(where.id); },
        async findUniqueOrThrow({ where }) {
            const office = officeDetails(where.id);
            if (!office) throw new Error("Requested record does not exist");
            return office;
        },
    };
    db.office_locations = {
        async findMany({ where }) {
            return state.locations.filter((location) => location.office_id === where.office_id).map((location) => ({ ...location, _count: { attendance_record: location.references } }));
        },
        async deleteMany({ where }) {
            state.locations = state.locations.filter((location) => !(location.office_id === where.office_id && where.id.in.includes(location.id)));
        },
        async update({ where, data }) {
            const location = state.locations.find((location) => location.id === where.id && location.office_id === where.office_id);
            if (!location) throw new Error("Location not found");
            Object.assign(location, data);
        },
        async create({ data }) {
            if (data.address === "Simulate storage failure") throw new Error("Storage failure");
            const location = { id: randomUUID(), ...data, references: 0 };
            state.locations.push(location);
            return location;
        },
    };
    db.employees = {
        async findUnique({ where }) { return where.id === "admin" ? actor : null; },
        async create({ data, select }) {
            const { departments, designations, company, ...fields } = data;
            const employee = { id: randomUUID(), ...fields, department_id: departments?.connect.id ?? null, designation_id: designations?.connect.id ?? null, company_id: company?.connect.id ?? null };
            state.employees.push(employee);
            return Object.fromEntries(Object.keys(select).map((key) => [key, employee[key]]));
        },
    };
    db.$transaction = async (operation) => {
        const before = structuredClone(state);
        try { return await operation(db); }
        catch (error) { state = before; throw error; }
    };
    const mocks = {
        "@/utils/prisma": { db },
        "./jwt": { verifyToken: async (token) => token === "admin" ? { id: "admin" } : null },
        "@/app/api/_utils/handlePrismaError": { handlePrismaError: (error, duplicate) => new Error(error.code === "P2002" ? duplicate : error.message) },
        "../../_utils/handlePrismaError": { handlePrismaError: (error, duplicate) => new Error(error.code === "P2002" ? duplicate : error.message) },
        "../_utils/handlePrismaError": { handlePrismaError: (error) => error },
    };
    return { db, actor, state: () => state, load: (file) => loadTs(file, mocks) };
}

for (const [resource, model, field, output, limit] of [
    ["company", "company", "name", "name", 100],
    ["department", "departments", "department_name", "department_name", 50],
    ["designation", "designations", "designation", "designations", 50],
]) {
    test(`${resource}: add, reopen and update the correct field`, async () => {
        const app = fixture();
        const list = app.load(`app/api/library/${resource}/route.ts`);
        const detail = app.load(`app/api/library/${resource}/[id]/route.ts`);
        const response = await list.POST(request("POST", { [field]: "  New name  " }));
        assert.equal(response.status, 201);
        const record = await response.json();
        assert.equal(record[output], "New name");
        assert.equal((await (await detail.GET(request("GET"), context(record.id))).json())[output], "New name");
        assert.equal((await detail.PUT(request("PUT", { [field]: "  Updated name  " }), context(record.id))).status, 200);
        assert.equal((await (await detail.GET(request("GET"), context(record.id))).json())[output], "Updated name");
    });

    test(`${resource}: invalid and malformed input cannot add or change a record`, async () => {
        const app = fixture();
        const list = app.load(`app/api/library/${resource}/route.ts`);
        const detail = app.load(`app/api/library/${resource}/[id]/route.ts`);
        const initial = await (await list.POST(request("POST", { [field]: "Original" }))).json();
        for (const body of [null, {}, { [field]: " " }, { [field]: "x".repeat(limit + 1) }, { [field]: 42 }]) {
            for (const response of [await list.POST(request("POST", body)), await detail.PUT(request("PUT", body), context(initial.id))]) {
                assert.equal(response.status, 400);
                assert.ok((await response.json()).message);
            }
        }
        const malformed = new Request("http://localhost/api/test", { method: "POST", headers: { authorization: "Bearer admin" }, body: "{" });
        assert.equal((await list.POST(malformed)).status, 400);
        assert.equal(app.state()[model].find((record) => record.id === initial.id)[output], "Original");
    });

    test(`${resource}: save requires an admin and returns useful missing-record errors`, async () => {
        const app = fixture();
        const list = app.load(`app/api/library/${resource}/route.ts`);
        const detail = app.load(`app/api/library/${resource}/[id]/route.ts`);
        assert.equal((await list.POST(request("POST", { [field]: "Name" }, "invalid"))).status, 401);
        app.actor.is_admin = false;
        assert.equal((await list.POST(request("POST", { [field]: "Name" }))).status, 403);
        assert.equal((await detail.PUT(request("PUT", { [field]: "Name" }), context(randomUUID()))).status, 403);
        app.actor.is_admin = true;
        const missing = await detail.GET(request("GET"), context(randomUUID()));
        assert.equal(missing.status, 404);
        assert.ok((await missing.json()).message);
    });
}

const officePayload = (name = "Office") => ({ name, company_id: companyId, locations: [{ id: null, address: "Address", lat: 0, lng: 0 }] });
const toOfficePayload = (office) => ({ name: office.name, company_id: office.company_id, locations: office.office_locations.map((location) => ({ id: location.id, address: location.address, lat: location.latitude, lng: location.longitude })) });

test("office coordinate fields preserve unselected values and accept an explicit zero", () => {
    const { coordinateValue } = loadTs("app/(authed)/library/offices/form-utils.ts");
    for (const value of [null, undefined, ""]) assert.equal(coordinateValue(value), null);
    for (const value of [0, "0"]) assert.equal(coordinateValue(value), 0);
    assert.equal(coordinateValue("23.81"), 23.81);
});

test("offices: create all fields, update coordinates, add a location and save it again with the same ID", async () => {
    const app = fixture();
    const list = app.load("app/api/library/office/route.ts");
    const detail = app.load("app/api/library/office/[id]/route.ts");
    const created = await list.POST(request("POST", officePayload()));
    assert.equal(created.status, 201);
    const office = await created.json();
    assert.ok(office.office_locations[0].id);
    assert.equal(office.office_locations[0].latitude, 0);
    const values = toOfficePayload(office);
    values.name = "Updated Office";
    values.locations[0] = { ...values.locations[0], address: "Updated address", lat: -45, lng: 120 };
    values.locations.push({ id: null, address: "New location", lat: 23, lng: 90 });
    const saved = await detail.PUT(request("PUT", values), context(office.id));
    assert.equal(saved.status, 200);
    const firstSave = await saved.json();
    assert.equal(firstSave.office_locations.length, 2);
    assert.equal(firstSave.office_locations[0].id, office.office_locations[0].id);
    const secondSave = await detail.PUT(request("PUT", toOfficePayload(firstSave)), context(office.id));
    assert.equal(secondSave.status, 200);
    assert.deepEqual((await secondSave.json()).office_locations, firstSave.office_locations);
    const reopened = await (await detail.GET(request("GET"), context(office.id))).json();
    assert.equal(reopened.name, "Updated Office");
    assert.equal(reopened.office_locations[0].address, "Updated address");
    assert.equal(reopened.office_locations[0].latitude, -45);
    const trimmed = toOfficePayload(reopened);
    trimmed.locations.pop();
    assert.equal((await detail.PUT(request("PUT", trimmed), context(office.id))).status, 200);
    assert.equal(app.state().locations.length, 1);
});

test("offices: invalid locations and company IDs cannot create or partially update offices", async () => {
    const app = fixture();
    const list = app.load("app/api/library/office/route.ts");
    const detail = app.load("app/api/library/office/[id]/route.ts");
    const office = await (await list.POST(request("POST", officePayload()))).json();
    for (const body of [null, {}, { ...officePayload(), company_id: "" }, { ...officePayload(), locations: [] },
        ...[{ address: " " }, { lat: null }, { lng: null }, { lat: 91 }, { lng: -181 }, { lat: "23" }].map((change) => ({ ...officePayload(), locations: [{ ...officePayload().locations[0], ...change }] }))]) {
        assert.equal((await list.POST(request("POST", body))).status, 400);
        assert.equal((await detail.PUT(request("PUT", body), context(office.id))).status, 400);
    }
    assert.equal(app.state().offices.length, 1);
    assert.equal(app.state().offices[0].name, "Office");
    const failure = toOfficePayload(office);
    failure.name = "Should roll back";
    failure.locations.push({ address: "Simulate storage failure", lat: 1, lng: 1 });
    assert.equal((await detail.PUT(request("PUT", failure), context(office.id))).status, 400);
    assert.equal(app.state().offices[0].name, "Office");
    assert.equal(app.state().locations.length, 1);
});

test("offices: reject foreign and duplicate location IDs; explain why locations with attendance cannot be removed", async () => {
    const app = fixture();
    const list = app.load("app/api/library/office/route.ts");
    const detail = app.load("app/api/library/office/[id]/route.ts");
    const office = await (await list.POST(request("POST", officePayload()))).json();
    const values = toOfficePayload(office);
    const foreign = { ...values, locations: [{ ...values.locations[0], id: randomUUID() }] };
    const response = await detail.PUT(request("PUT", foreign), context(office.id));
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /does not belong/);
    assert.equal((await detail.PUT(request("PUT", { ...values, locations: [values.locations[0], values.locations[0]] }), context(office.id))).status, 400);
    app.state().locations[0].references = 1;
    const removal = await detail.PUT(request("PUT", officePayload("Replace existing location")), context(office.id));
    assert.equal(removal.status, 400);
    assert.match((await removal.json()).message, /attendance records/);
    assert.equal(app.state().offices[0].name, "Office");
    assert.equal((await detail.PUT(request("PUT", values), context(office.id))).status, 200);
});

test("users: creation saves all fields, hashes the password and rejects invalid input", async () => {
    const app = fixture();
    const users = app.load("app/api/users/route.ts");
    const values = { id_card_no: " EMP-10 ", name: " User ", email: " user@example.com ", phone_no: " 01700000000 ", password: "new-password", department_id: randomUUID(), designation_id: randomUUID(), company_id: companyId, isActive: true, isAdmin: false };
    const response = await users.POST(request("POST", values));
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.equal(saved.user.name, "User");
    assert.equal(Object.hasOwn(saved.user, "password"), false);
    const stored = app.state().employees[0];
    assert.equal(await bcrypt.compare(values.password, stored.hashed_password), true);
    assert.equal(stored.password, null);
    assert.equal(stored.department_id, values.department_id);
    assert.equal(stored.designation_id, values.designation_id);
    assert.equal(stored.company_id, companyId);
    assert.equal(stored.is_active, true);
    assert.equal(stored.is_admin, false);
    for (const invalid of [null, {}, { ...values, email: "invalid" }, { ...values, department_id: "invalid" }, { ...values, password: "short" }]) {
        assert.equal((await users.POST(request("POST", invalid))).status, 400);
    }
    assert.equal(app.state().employees.length, 1);
});

test("shared save requests report JSON, non-JSON and network failures", async (t) => {
    const { requestJson } = loadTs("utils/adminForms.ts");
    const mocked = t.mock.method(globalThis, "fetch", async () => Response.json({ message: "Duplicate name" }, { status: 400 }));
    await assert.rejects(requestJson("/api/test"), /Duplicate name/);
    mocked.mock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    await assert.rejects(requestJson("/api/test"), /Please try again/);
    mocked.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
    await assert.rejects(requestJson("/api/test"), /Failed to fetch/);
    mocked.mock.mockImplementation(async () => Response.json({ id: "saved" }));
    assert.deepEqual(await requestJson("/api/test"), { id: "saved" });
});
