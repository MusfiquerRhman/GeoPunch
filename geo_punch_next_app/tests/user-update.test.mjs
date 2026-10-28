import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { loadTs } from "./load-ts.mjs";

const schema = loadTs("app/(authed)/admin/users/schema.ts");
const { employeeFormValues } = loadTs("app/(authed)/admin/users/form-utils.ts");
const { fetchAllOptions: fetchAllUserOptions } = loadTs("utils/adminForms.ts");
const ids = {
    admin: "00000000-0000-4000-8000-000000000001",
    employee: "00000000-0000-4000-8000-000000000002",
    department: "00000000-0000-4000-8000-000000000003",
    designation: "00000000-0000-4000-8000-000000000004",
    company: "00000000-0000-4000-8000-000000000005",
};
const originalEmployee = {
    id: ids.employee, id_card_no: "EMP-1", name: "Employee", email: "employee@example.com",
    phone_no: "01700000000", department_id: null, designation_id: null, company_id: null,
    is_active: true, is_admin: false, password: "old-password", hashed_password: null,
};

function fixture() {
    let employee = { ...originalEmployee };
    const actor = { id: ids.admin, is_active: true, is_admin: true, company_id: null };
    const updates = [];
    const employees = {
        async findUnique({ where, select }) {
            const row = where.id === ids.admin ? actor
                : where.id === employee.id || where.id_card_no === employee.id_card_no ? {
                    ...employee,
                    departments: employee.department_id ? { department_name: "Engineering" } : null,
                    designations: employee.designation_id ? { designations: "Engineer" } : null,
                } : null;
            if (!row) return null;
            return Object.fromEntries(Object.keys(select).map((key) => [key, row[key]]));
        },
        async update({ where, data, select }) {
            assert.equal(where.id, employee.id);
            updates.push(data);
            const next = { ...employee };
            for (const [key, value] of Object.entries(data)) {
                const foreignKey = { departments: "department_id", designations: "designation_id", company: "company_id" }[key];
                if (foreignKey) next[foreignKey] = value.disconnect ? null : value.connect.id;
                else next[key] = value;
            }
            employee = next;
            return select ? Object.fromEntries(Object.keys(select).map((key) => [key, employee[key]])) : employee;
        },
        async findMany() { return []; },
    };
    const db = { employees };
    const auth = loadTs("app/api/_utils/auth.ts", {
        "@/utils/prisma": { db },
        "./jwt": { verifyToken: async (token) => token === "test-admin" ? { id: ids.admin } : null },
    });
    const route = loadTs("app/api/users/[id]/route.ts", {
        "@/utils/prisma": { db },
        "../../_utils/auth": auth,
        "@/app/(authed)/admin/users/schema": schema,
        "@/app/api/_utils/handlePrismaError": { handlePrismaError: (error) => error },
    });
    const loginMocks = {
        "@/utils/prisma": { db },
        "../../../_utils/jwt": { signToken: async () => "test-session" },
        "../../_utils/jwt": { signToken: async () => "test-session" },
        "../../../_utils/cookies": { isAuthCookieSecure: () => false },
        "../../_utils/cookies": { isAuthCookieSecure: () => false },
        "../../_utils/auth": auth,
    };
    const mobileLogin = loadTs("app/api/auth/geo_punch/login/route.ts", loginMocks);
    const browserLogin = loadTs("app/api/auth/login/route.ts", loginMocks);
    const context = { params: Promise.resolve({ id: ids.employee }) };
    return {
        actor, updates, employees, mobileLogin, browserLogin,
        current: () => employee,
        get: () => route.GET(new Request("http://localhost/api/users/" + ids.employee, {
            headers: { authorization: "Bearer test-admin" },
        }), context),
        put: (body, token = "test-admin") => route.PUT(new Request("http://localhost/api/users/" + ids.employee, {
            method: "PUT", headers: { authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }), context),
    };
}

test("unassigned relationships and nullable flags load as valid, editable form values", () => {
    const values = employeeFormValues({ ...originalEmployee, is_active: null, is_admin: null });
    assert.equal(schema.editUserSchema.safeParse(values).success, true);
    assert.deepEqual([values.department_id, values.designation_id, values.company_id, values.password], ["", "", "", ""]);
    assert.equal(values.isActive, false);
    assert.equal(values.isAdmin, false);
    assert.equal(schema.editUserSchema.safeParse({ ...values, department_id: null, designation_id: null, company_id: null }).success, true);
});

test("every text field, relationship and checkbox saves and is returned on reopening", async () => {
    const app = fixture();
    const values = {
        ...employeeFormValues(originalEmployee), id_card_no: "EMP-2", name: "Updated Employee",
        email: "updated@example.com", phone_no: "01811111111", department_id: ids.department,
        designation_id: ids.designation, company_id: ids.company, isActive: false, isAdmin: true,
    };
    const response = await app.put(values);
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.deepEqual(employeeFormValues(saved), values);
    assert.deepEqual(await (await app.get()).json(), saved);
    assert.equal(Object.hasOwn(saved, "password"), false);
    assert.equal(Object.hasOwn(saved, "hashed_password"), false);
    const toggled = { ...values, isActive: true, isAdmin: false };
    assert.equal((await app.put(toggled)).status, 200);
    assert.deepEqual(employeeFormValues(await (await app.get()).json()), toggled);
});

test("password reset works with unassigned relationships and old password is rejected by both logins", async () => {
    const app = fixture();
    const response = await app.put({ ...employeeFormValues(originalEmployee), password: "new-password", isAdmin: true });
    assert.equal(response.status, 200);
    assert.equal(app.current().password, null);
    assert.notEqual(app.current().hashed_password, "new-password");
    assert.equal(await bcrypt.compare("new-password", app.current().hashed_password), true);
    for (const login of [app.mobileLogin, app.browserLogin]) {
        for (const [password, status] of [["old-password", 401], ["new-password", 200]]) {
            const result = await login.POST(new Request("http://localhost/api/auth/login", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_card_no: originalEmployee.id_card_no, password }),
            }));
            assert.equal(result.status, status);
        }
    }
    assert.equal(employeeFormValues(await response.json()).password, "");
});

test("blank password preserves an existing hash and permits other field changes", async () => {
    const app = fixture();
    assert.equal((await app.put({ ...employeeFormValues(originalEmployee), password: "new-password" })).status, 200);
    const hash = app.current().hashed_password;
    assert.equal((await app.put({ ...employeeFormValues(app.current()), name: "Renamed" })).status, 200);
    assert.equal(app.current().hashed_password, hash);
    assert.equal(Object.hasOwn(app.updates[1], "hashed_password"), false);
    assert.equal(app.current().name, "Renamed");
});

test("assignments can be cleared explicitly and omitted assignments are preserved", async () => {
    const app = fixture();
    const assigned = { ...employeeFormValues(originalEmployee), department_id: ids.department, designation_id: ids.designation, company_id: ids.company };
    assert.equal((await app.put(assigned)).status, 200);
    const { department_id, designation_id, company_id, ...withoutAssignments } = assigned;
    assert.equal((await app.put(withoutAssignments)).status, 200);
    assert.deepEqual([app.current().department_id, app.current().designation_id, app.current().company_id], [department_id, designation_id, company_id]);
    assert.equal((await app.put({ ...assigned, department_id: "", designation_id: null, company_id: "" })).status, 200);
    assert.deepEqual([app.current().department_id, app.current().designation_id, app.current().company_id], [null, null, null]);
});

test("invalid values produce JSON errors without saving any fields", async () => {
    const app = fixture();
    const valid = employeeFormValues(originalEmployee);
    for (const body of [null, {}, { ...valid, password: "short" }, { ...valid, department_id: "invalid" },
        { ...valid, designation_id: "invalid" }, { ...valid, company_id: "invalid" },
        { ...valid, email: "invalid" }, { ...valid, id_card_no: "" }, { ...valid, name: "" },
        { ...valid, phone_no: "" }, { ...valid, isActive: "false" }, { ...valid, isAdmin: "false" }]) {
        const response = await app.put(body);
        assert.equal(response.status, 400);
        assert.equal(typeof (await response.json()).message, "string");
    }
    assert.equal(app.updates.length, 0);
});

test("updates require an active admin", async () => {
    const app = fixture();
    const valid = employeeFormValues(originalEmployee);
    assert.equal((await app.put(valid, "invalid")).status, 401);
    app.actor.is_admin = false;
    assert.equal((await app.put(valid)).status, 403);
    app.actor.is_active = false;
    assert.equal((await app.put(valid)).status, 401);
    assert.equal(app.updates.length, 0);
});

test("all dropdowns include choices beyond the first ten records", async (t) => {
    const signal = new AbortController().signal;
    const records = Array.from({ length: 23 }, (_, i) => ({ id: String(i + 1) }));
    const calls = [];
    t.mock.method(globalThis, "fetch", async (url, options) => {
        const parsed = new URL(url, "http://localhost");
        const page = Number(parsed.searchParams.get("page"));
        const key = { department: "departments", designation: "designations", company: "companies" }[parsed.pathname.split("/").at(-1)];
        assert.equal(options.signal, signal);
        calls.push([key, page]);
        return Response.json({ [key]: records.slice(page * 10, (page + 1) * 10), count: records.length });
    });
    for (const [endpoint, key] of [["department", "departments"], ["designation", "designations"], ["company", "companies"]]) {
        assert.deepEqual(await fetchAllUserOptions("/api/library/" + endpoint, key, signal), records);
        assert.deepEqual(calls.filter(([name]) => name === key).map(([, page]) => page), [0, 1, 2]);
    }
});

test("failed or malformed dropdown requests fail visibly instead of returning partial choices", async (t) => {
    const signal = new AbortController().signal;
    const mocked = t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Unauthorized" }, { status: 401 }));
    await assert.rejects(fetchAllUserOptions("/api/library/department", "departments", signal), /Unauthorized/);
    mocked.mock.mockImplementation(async () => Response.json({ departments: null }));
    await assert.rejects(fetchAllUserOptions("/api/library/department", "departments", signal), /Invalid options/);
    mocked.mock.mockImplementation(async () => Response.json({ departments: [], count: 1 }));
    await assert.rejects(fetchAllUserOptions("/api/library/department", "departments", signal), /Could not load all/);
    mocked.mock.mockImplementation(async () => Response.json({ departments: [], count: 0 }));
    assert.deepEqual(await fetchAllUserOptions("/api/library/department", "departments", signal), []);
});
