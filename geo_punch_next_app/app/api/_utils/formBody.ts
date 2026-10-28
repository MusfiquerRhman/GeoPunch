import type { z } from "zod";

export async function parseFormBody<T extends z.ZodType>(request: Request, schema: T): Promise<
    { data: z.output<T>; response: null } | { data: null; response: Response }
> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return { data: null, response: Response.json({ message: "Invalid request body" }, { status: 400 }) };
    }
    const result = schema.safeParse(body);
    if (!result.success) {
        return { data: null, response: Response.json({ message: result.error.issues[0].message }, { status: 400 }) };
    }
    return { data: result.data, response: null };
}
