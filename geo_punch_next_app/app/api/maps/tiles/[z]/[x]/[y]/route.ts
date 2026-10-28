const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

export async function GET(_request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
    const { z, x, y } = await params;
    const tileY = /^(\d{1,6})\.png$/.exec(y)?.[1];
    if (!/^\d{1,2}$/.test(z) || !/^\d{1,6}$/.test(x) || !tileY) {
        return Response.json({ message: "Invalid map tile" }, { status: 400 });
    }
    const zoom = Number(z);
    const column = Number(x);
    const row = Number(tileY);
    if (zoom > 19 || column >= 2 ** zoom || row >= 2 ** zoom) {
        return Response.json({ message: "Invalid map tile coordinates" }, { status: 400 });
    }

    const upstream = process.env.MAP_TILE_UPSTREAM_URL?.trim().replace(/\/+$/, "");
    if (!upstream) {
        return Response.json({ message: "The hosted map service is not configured" }, { status: 503 });
    }
    try {
        const url = new URL(`${upstream}/${zoom}/${column}/${row}.png`);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid map service configuration");
        const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60000) });
        if (!response.ok) {
            return Response.json({ message: "Map tile is not ready. Please try again." }, {
                status: response.status === 404 ? 404 : 503, headers: { "Retry-After": "10" },
            });
        }
        const tile = new Uint8Array(await response.arrayBuffer());
        if (!pngSignature.every((byte, index) => tile[index] === byte)) throw new Error("Invalid map tile response");
        return new Response(tile, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch {
        return Response.json({ message: "The hosted map service is temporarily unavailable" }, {
            status: 503, headers: { "Retry-After": "10" },
        });
    }
}
