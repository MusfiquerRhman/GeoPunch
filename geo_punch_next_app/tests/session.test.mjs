import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { NextRequest } from "next/server.js";
import { loadTs } from "./load-ts.mjs";

const WEEK = 604800;
const jwt = loadTs("app/api/_utils/jwt.ts", { jose });
const { createAuthSession } = loadTs("../geo_punch/context/authSession.ts");
const { apiRequest, ApiError } = loadTs("../geo_punch/constants/apiRequest.ts", {
    "./API_URL": { getApiUrl: (path) => "http://localhost/api" + path },
    "expo/fetch": { fetch: (...args) => globalThis.fetch(...args) },
    "../utils/deviceIdentity": { DEVICE_HEADER: "X-GeoPunch-Device", getDeviceCredential: async () => "a".repeat(64) },
});
const claims = { id: "employee-1", isAdmin: true };

function configure(t) {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "session-regression-test-secret-at-least-32-bytes";
    t.after(() => {
        if (original === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = original;
    });
}

function authFixture(stored = null, overrides = {}, validateSavedToken) {
    let saved = stored;
    let state = { token: null, loading: true, revision: 0 };
    let cacheClears = 0;
    const auth = createAuthSession({
        storage: {
            getToken: async () => saved,
            setToken: async (token) => { saved = token; },
            deleteToken: async () => { saved = null; },
            ...overrides,
        },
        onChange: (next) => { state = next; },
        clearCache: () => { cacheClears++; },
        validateSavedToken,
    });
    return { auth, state: () => state, saved: () => saved, cacheClears: () => cacheClears };
}

function serverFixture() {
    const employee = {
        ...claims, name: "Employee", id_card_no: "31", is_admin: true, is_active: true,
        hashed_password: bcrypt.hashSync("correct-password", 4), password: null,
        departments: null, designations: null,
    };
    const mocks = {
        "@/utils/prisma": { db: { employees: {
            findUnique: async ({ where }) => where.id_card_no === employee.id_card_no ? employee : null,
        } } },
        "../../../_utils/jwt": jwt,
        "../../../_utils/trustedDevices": {
            getDeviceCredentialHash: (request) => request.headers.get("X-GeoPunch-Device"),
            deviceDetails: () => ({}),
            recordDeviceSignIn: async () => ({ id: "trusted-device", status: "trusted", version: 1 }),
        },
        "../../_utils/jwt": jwt,
        "../../../_utils/cookies": { isAuthCookieSecure: () => false },
        "../../_utils/cookies": { isAuthCookieSecure: () => false },
        "../../_utils/auth": { migrateLegacyEmployeePasswords: async () => {} },
    };
    const mobile = loadTs("app/api/auth/geo_punch/login/route.ts", mocks);
    const browser = loadTs("app/api/auth/login/route.ts", mocks);
    const { proxy } = loadTs("proxy.ts", { "@/app/api/_utils/jwt": jwt });
    const dispatch = async (url, options = {}) => {
        const request = new NextRequest(url, options);
        const gate = await proxy(request);
        if (gate.headers.get("x-middleware-next") !== "1") return gate;
        if (request.nextUrl.pathname === "/api/auth/geo_punch/login") return mobile.POST(request);
        if (request.nextUrl.pathname === "/api/auth/login") return browser.POST(request);
        return Response.json({ success: true });
    };
    return { dispatch };
}

const loginOptions = (password = "correct-password") => ({
    method: "POST", device: true, headers: { "Content-Type": "application/json", "X-GeoPunch-Device": "a".repeat(64) },
    body: JSON.stringify({ id_card_no: "31", password }),
});

test("both logins replace expired credentials with a JWT and cookie lasting exactly one week", async (t) => {
    configure(t);
    const { dispatch } = serverFixture();
    const now = Math.floor(Date.now() / 1000);
    const expired = await new jose.SignJWT(claims).setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now - WEEK).setExpirationTime(now - 1)
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    assert.equal(await jwt.verifyToken(expired), null);
    assert.equal((await dispatch("http://localhost/api/geo_punch/users", {
        headers: { authorization: "Bearer " + expired, cookie: "token=" + expired },
    })).status, 401);

    for (const path of ["/api/auth/geo_punch/login", "/api/auth/login"]) {
        const options = loginOptions();
        options.headers.authorization = "Bearer " + expired;
        options.headers.cookie = "token=" + expired;
        const response = await dispatch("http://localhost" + path, options);
        assert.equal(response.status, 200);
        const cookie = response.cookies.get("token");
        assert.equal(cookie.maxAge, WEEK);
        const payload = await jwt.verifyToken(cookie.value);
        assert.equal(payload.exp - payload.iat, WEEK);
        const key = new TextEncoder().encode(process.env.JWT_SECRET);
        await jose.jwtVerify(cookie.value, key, { currentDate: new Date((payload.exp - 1) * 1000) });
        await assert.rejects(jose.jwtVerify(cookie.value, key, { currentDate: new Date(payload.exp * 1000) }),
            { code: "ERR_JWT_EXPIRED" });
        if (path.includes("geo_punch")) assert.equal((await response.json()).token, cookie.value);
    }
});

test("expired session can log in again; a late unauthorized response cannot discard the new session", async (t) => {
    configure(t);
    t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
    const { dispatch } = serverFixture();
    t.mock.method(globalThis, "fetch", dispatch);
    const app = authFixture();
    await app.auth.restore();
    const first = await apiRequest("/auth/geo_punch/login", loginOptions());
    await app.auth.login(first.token);
    const oldRevision = app.state().revision;
    const oldLogout = () => app.auth.logout(oldRevision);
    t.mock.timers.tick((WEEK + 1) * 1000);
    await assert.rejects(apiRequest("/geo_punch/users", {
        token: first.token, onUnauthorized: oldLogout,
    }), (error) => error instanceof ApiError && error.status === 401 && /session has expired/.test(error.message));
    assert.equal(app.state().token, null);
    assert.equal(app.saved(), null);

    await assert.rejects(apiRequest("/auth/geo_punch/login", loginOptions("wrong-password")),
        /Invalid ID Card No or password/);
    const next = await apiRequest("/auth/geo_punch/login", loginOptions());
    await app.auth.login(next.token);
    await assert.rejects(apiRequest("/geo_punch/users", {
        token: first.token, onUnauthorized: oldLogout,
    }), /session has expired/);
    assert.equal(app.state().token, next.token);
    assert.equal(app.saved(), next.token);
    assert.deepEqual(await apiRequest("/geo_punch/users", { token: next.token }), { success: true });
});

test("login shows credential errors, and both request transports omit stale cookies", async (t) => {
    const calls = [];
    let unauthorizedCalls = 0;
    t.mock.method(globalThis, "fetch", async (_url, options) => {
        calls.push(options);
        return Response.json({ error: "Invalid ID Card No or password" }, { status: 401 });
    });
    const form = new FormData();
    form.append("id_card_no", "31");
    for (const body of [loginOptions().body, form]) {
        await assert.rejects(apiRequest("/auth/geo_punch/login", {
            method: "POST", body, onUnauthorized: async () => { unauthorizedCalls++; },
        }), /Invalid ID Card No or password/);
    }
    assert.equal(unauthorizedCalls, 0);
    for (const options of calls) {
        assert.equal(options.credentials, "omit");
        assert.equal(options.headers.has("authorization"), false);
    }
});

test("null, empty and non-JSON success responses fail clearly before reading a token", async (t) => {
    const mocked = t.mock.method(globalThis, "fetch", async () => Response.json(null));
    for (const response of [() => Response.json(null), () => new Response(""), () => new Response("<html>Login</html>")]) {
        mocked.mock.mockImplementation(async () => response());
        await assert.rejects(apiRequest("/auth/geo_punch/login", loginOptions()),
            (error) => error instanceof ApiError && /invalid response/.test(error.message));
    }
});

test("restoring expired or malformed saved tokens clears them and allows a fresh login", async (t) => {
    configure(t);
    const valid = await jwt.signToken(claims);
    const expired = jose.base64url.encode("{}").concat(".", jose.base64url.encode(JSON.stringify({ exp: 1 })), ".signature");
    for (const saved of [expired, "invalid", "e30.e30.signature", "e30.bnVsbA.signature", ""]) {
        const app = authFixture(saved);
        await app.auth.restore();
        assert.equal(app.state().loading, false);
        assert.equal(app.state().token, null);
        assert.equal(app.saved(), null);
        await app.auth.login(valid);
        assert.equal(app.state().token, valid);
    }
    const app = authFixture(valid);
    await app.auth.restore();
    assert.equal(app.state().token, valid);
    assert.equal(app.cacheClears(), 0);
    for (const invalid of [null, undefined, "", "invalid", expired]) {
        await assert.rejects(app.auth.login(invalid), /valid sign-in token/);
        assert.equal(app.state().token, valid);
    }
});

test("remembered and biometric sessions require server approval before publishing a token", async (t) => {
    configure(t);
    const valid = await jwt.signToken(claims);
    const denied = authFixture(valid, {}, async () => false);
    await denied.auth.restore();
    assert.equal(denied.state().token, null);
    assert.equal(denied.saved(), null);
    const biometric = authFixture(valid, {}, async () => false);
    assert.equal(await biometric.auth.unlock(), false);
    assert.equal(biometric.state().token, null);
    const offline = authFixture(valid, {}, async () => { throw new Error("Offline"); });
    await offline.auth.restore();
    assert.equal(offline.state().token, null);
    assert.equal(offline.state().loading, false);
    assert.equal(offline.saved(), valid);
    const trusted = authFixture(valid, {}, async () => true);
    assert.equal(await trusted.auth.unlock(), true);
    assert.equal(trusted.state().token, valid);
});

test("slow old logout cannot delete a new login from secure storage", async (t) => {
    configure(t);
    const first = await jwt.signToken(claims);
    const next = await jwt.signToken({ ...claims, id: "employee-2" });
    let saved = first;
    let releaseDelete;
    let startedDelete;
    const deleting = new Promise((resolve) => { startedDelete = resolve; });
    const blocked = new Promise((resolve) => { releaseDelete = resolve; });
    const app = authFixture(first, {
        getToken: async () => saved,
        setToken: async (token) => { saved = token; },
        deleteToken: async () => { startedDelete(); await blocked; saved = null; },
    });
    await app.auth.restore();
    const oldRevision = app.state().revision;
    const logout = app.auth.logout(oldRevision);
    await deleting;
    const login = app.auth.login(next);
    await app.auth.logout(oldRevision);
    assert.equal(app.state().token, null);
    releaseDelete();
    await Promise.all([logout, login]);
    assert.equal(saved, next);
    assert.equal(app.state().token, next);
    assert.equal(app.cacheClears(), 2);
});

test("late startup reads cannot overwrite a login and secure-store errors do not block retry", async (t) => {
    configure(t);
    const valid = await jwt.signToken(claims);
    let finishRead;
    const app = authFixture(null, {
        getToken: () => new Promise((resolve) => { finishRead = resolve; }),
    });
    const restoring = app.auth.restore();
    await app.auth.login(valid);
    finishRead("old-invalid-token");
    await restoring;
    assert.equal(app.state().token, valid);
    assert.equal(app.saved(), valid);

    let failWrite = true;
    const unavailable = authFixture(null, {
        getToken: async () => { throw new Error("Store unavailable"); },
        setToken: async () => { if (failWrite) throw new Error("Store unavailable"); },
        deleteToken: async () => { throw new Error("Store unavailable"); },
    });
    await unavailable.auth.restore();
    assert.equal(unavailable.state().loading, false);
    await assert.rejects(unavailable.auth.login(valid), /Store unavailable/);
    assert.equal(unavailable.state().token, null);
    failWrite = false;
    await unavailable.auth.login(valid);
    assert.equal(unavailable.state().token, valid);
    await unavailable.auth.logout(unavailable.state().revision);
    assert.equal(unavailable.state().token, null);
});
