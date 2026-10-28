export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message || body?.error || "Could not save or load this record. Please try again.");
    }
    if (body === null) throw new Error("The server returned an invalid response. Please try again.");
    return body as T;
}

// Library list endpoints are paginated; selectors must load every page.
export async function fetchAllOptions<T>(endpoint: string, key: string, signal: AbortSignal): Promise<T[]> {
    const options: T[] = [];
    for (let page = 0; ; page += 1) {
        const data = await requestJson<Record<string, unknown>>(`${endpoint}?page=${page}`, { signal });
        const records = data[key];
        if (!Array.isArray(records) || typeof data.count !== "number" || !Number.isInteger(data.count) || data.count < 0) {
            throw new Error("Invalid options response. Please reload and try again.");
        }
        options.push(...records);
        if (options.length >= data.count) return options;
        if (records.length === 0) throw new Error("Could not load all options. Please reload and try again.");
    }
}
