import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Exercise source modules with isolated database/session dependencies and no new test packages.
export function loadTs(relativePath, mocks = {}, cache = new Map()) {
    let filename = path.resolve(projectDirectory, relativePath);
    if (!path.extname(filename)) filename += ".ts";
    if (cache.has(filename)) return cache.get(filename).exports;
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }, fileName: filename,
    });
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const localRequire = createRequire(filename);
    const requireWithMocks = (name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith("@/")) return loadTs(name.slice(2), mocks, cache);
        if (name.startsWith(".")) {
            const target = path.resolve(path.dirname(filename), name);
            if (existsSync(target + ".ts")) return loadTs(path.relative(projectDirectory, target), mocks, cache);
        }
        return localRequire(name);
    };
    new Function("require", "module", "exports", outputText)(requireWithMocks, loaded, loaded.exports);
    return loaded.exports;
}
