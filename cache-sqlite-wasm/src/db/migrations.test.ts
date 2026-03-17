import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../types";
import { runMigrations } from "./migrations";

describe("runMigrations", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("skips the schema_version query when the table does not exist", async () => {
        const { db, exec } = createMockDatabase({ hasSchemaVersion: false });

        await runMigrations(db);

        const sqlCalls = exec.mock.calls.map(([sql]) => sql);
        expect(sqlCalls).toContain("SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1");
        expect(sqlCalls).not.toContain("SELECT version FROM schema_version LIMIT 1");
    });

    it("reads the schema version when the table already exists", async () => {
        const { db, exec } = createMockDatabase({ hasSchemaVersion: true, currentVersion: 5 });

        await runMigrations(db);

        const sqlCalls = exec.mock.calls.map(([sql]) => sql);
        expect(sqlCalls).toContain("SELECT version FROM schema_version LIMIT 1");
    });
});

function createMockDatabase(options: { hasSchemaVersion: boolean; currentVersion?: number }) {
    const exec = vi.fn(async (sql: string, params?: any[]) => {
        if (sql === "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1") {
            return [queryResult(["1"], options.hasSchemaVersion && params?.[0] === "schema_version" ? [[1]] : [])];
        }

        if (sql === "SELECT version FROM schema_version LIMIT 1") {
            return [queryResult(["version"], options.currentVersion === undefined ? [] : [[options.currentVersion]])];
        }

        if (sql === "SELECT name FROM sqlite_master WHERE type='table' AND name='events'") {
            return [queryResult(["name"], [["events"]])];
        }

        if (sql === "SELECT name FROM sqlite_master WHERE type='table' AND name='nip05'") {
            return [queryResult(["name"], [["nip05"]])];
        }

        if (sql === "PRAGMA table_info(events)") {
            return [queryResult(["cid", "name"], [
                [0, "id"],
                [1, "pubkey"],
                [2, "created_at"],
                [3, "kind"],
                [4, "tags"],
                [5, "content"],
                [6, "sig"],
                [7, "raw"],
                [8, "deleted"],
                [9, "relay_url"],
            ])];
        }

        return [];
    });

    const run = vi.fn(async () => {});

    return {
        db: { exec, run } as unknown as Database,
        exec,
        run,
    };
}

function queryResult(columns: string[], values: any[][]) {
    return { columns, values };
}
