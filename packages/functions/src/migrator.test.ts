import { afterEach, describe, expect, it, vi } from "vitest";

describe("database migrator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("runs the node-postgres Drizzle migrator against the packaged migrations", async () => {
    const db = {};
    const migrateNodePostgres = vi.fn(async () => undefined);
    const migrateDataApi = vi.fn(async () => undefined);
    const closePool = vi.fn(async () => undefined);

    vi.doMock("drizzle-orm/node-postgres/migrator", () => ({
      migrate: migrateNodePostgres,
    }));
    vi.doMock("drizzle-orm/aws-data-api/pg/migrator", () => ({
      migrate: migrateDataApi,
    }));
    vi.doMock("@workboard-mcp/core/db/drizzle", () => ({
      getDb: () => db,
      getDatabaseDriver: () => "node-postgres",
    }));
    vi.doMock("@workboard-mcp/core/db/pool", () => ({
      closePool,
    }));

    const { handler } = await import("./migrator");

    await handler();

    expect(migrateNodePostgres).toHaveBeenCalledWith(db, {
      migrationsFolder: "./drizzle",
    });
    expect(migrateDataApi).not.toHaveBeenCalled();
    expect(closePool).toHaveBeenCalledTimes(1);
  });

  it("runs the Data API Drizzle migrator when production uses Aurora Data API", async () => {
    const db = {};
    const migrateNodePostgres = vi.fn(async () => undefined);
    const migrateDataApi = vi.fn(async () => undefined);
    const closePool = vi.fn(async () => undefined);

    vi.doMock("drizzle-orm/node-postgres/migrator", () => ({
      migrate: migrateNodePostgres,
    }));
    vi.doMock("drizzle-orm/aws-data-api/pg/migrator", () => ({
      migrate: migrateDataApi,
    }));
    vi.doMock("@workboard-mcp/core/db/drizzle", () => ({
      getDb: () => db,
      getDatabaseDriver: () => "data-api",
    }));
    vi.doMock("@workboard-mcp/core/db/pool", () => ({
      closePool,
    }));

    const { handler } = await import("./migrator");

    await handler();

    expect(migrateDataApi).toHaveBeenCalledWith(db, {
      migrationsFolder: "./drizzle",
    });
    expect(migrateNodePostgres).not.toHaveBeenCalled();
    expect(closePool).toHaveBeenCalledTimes(1);
  });
});
