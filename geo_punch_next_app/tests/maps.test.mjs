import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const { GET } = loadTs("app/api/maps/tiles/[z]/[x]/[y]/route.ts");
const tileRequest = (z = "15", x = "24613", y = "14148.png") => GET(new Request("http://localhost/api/maps/tiles/15/24613/14148.png"), {
    params: Promise.resolve({ z, x, y }),
});
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);

function configure(t) {
    const original = process.env.MAP_TILE_UPSTREAM_URL;
    process.env.MAP_TILE_UPSTREAM_URL = "http://geopunch-maps/tile";
    t.after(() => { if (original === undefined) delete process.env.MAP_TILE_UPSTREAM_URL; else process.env.MAP_TILE_UPSTREAM_URL = original; });
}

test("map tiles use only the configured VPS service and return cacheable PNGs", async (t) => {
    configure(t);
    t.mock.method(globalThis, "fetch", async (url, options) => {
        assert.equal(String(url), "http://geopunch-maps/tile/15/24613/14148.png");
        assert.equal(options.cache, "no-store");
        assert.ok(options.signal instanceof AbortSignal);
        return new Response(png, { headers: { "Content-Type": "image/png" } });
    });
    const response = await tileRequest();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/png");
    assert.match(response.headers.get("Cache-Control"), /max-age=3600/);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
});

test("invalid tile coordinates cannot trigger upstream requests", async (t) => {
    configure(t);
    const mocked = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not fetch"); });
    for (const args of [["20", "1", "1.png"], ["-1", "1", "1.png"], ["1", "2", "0.png"],
        ["1", "0", "2.png"], ["15", "../secret", "1.png"], ["15", "1", "1.jpg"], ["15", "1", "1.png?url=external"]]) {
        assert.equal((await tileRequest(...args)).status, 400);
    }
    assert.equal(mocked.mock.callCount(), 0);
});

test("map service failures remain local errors and never fall back to OpenStreetMap tiles", async (t) => {
    configure(t);
    const mocked = t.mock.method(globalThis, "fetch", async () => new Response("not ready", { status: 404 }));
    assert.equal((await tileRequest()).status, 404);
    mocked.mock.mockImplementation(async () => new Response("unavailable", { status: 500 }));
    assert.equal((await tileRequest()).status, 503);
    mocked.mock.mockImplementation(async () => new Response("not a PNG"));
    assert.equal((await tileRequest()).status, 503);
    delete process.env.MAP_TILE_UPSTREAM_URL;
    assert.equal((await tileRequest()).status, 503);
    assert.equal(mocked.mock.callCount(), 3);
});

test("public map tiles and assets do not expose protected GeoPunch routes", async () => {
    const { proxy } = loadTs("proxy.ts", { "@/app/api/_utils/jwt": { verifyToken: async () => null } });
    const check = (pathname) => proxy({ nextUrl: { pathname }, url: "http://localhost" + pathname, headers: new Headers(), cookies: { get: () => undefined } });
    for (const path of ["/api/maps/tiles/15/24613/14148.png", "/maps/leaflet/leaflet.js", "/maps/leaflet/leaflet.css", "/maps/leaflet/images/marker-icon.png"]) {
        assert.equal((await check(path)).headers.get("x-middleware-next"), "1");
    }
    assert.equal((await check("/api/users")).status, 401);
    assert.equal((await check("/api/geo_punch/record")).status, 401);
    assert.equal((await check("/uploads/private.jpg")).status, 404);
    assert.equal((await check("/admin/users")).status, 307);
});

test("mobile maps load tiles and Leaflet assets from GeoPunch and escape office text", (t) => {
    const original = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = "http://200.234.33.89:10000";
    t.after(() => { if (original === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = original; });
    const { locationMapHtml } = loadTs("../geo_punch/components/location-map-html.ts");
    const html = locationMapHtml({ latitude: 23.81, longitude: 90.41, offices: [{ id: 1, name: "</script><script>alert(1)</script>", address: "Office", latitude: 23.8, longitude: 90.4 }] });
    assert.ok(html.includes("http://200.234.33.89:10000/api/maps/tiles/{z}/{x}/{y}.png"));
    assert.ok(html.includes("http://200.234.33.89:10000/maps/leaflet/leaflet.js"));
    assert.ok(html.includes("http://200.234.33.89:10000/maps/leaflet/leaflet.css"));
    assert.equal(html.includes("tile.openstreetmap.org"), false);
    assert.equal(html.includes("unpkg.com"), false);
    assert.equal(html.includes("</script><script>alert"), false);
    assert.ok(html.includes("openstreetmap.org/copyright"));
});
