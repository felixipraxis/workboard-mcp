import { afterEach, describe, expect, it, vi } from "vitest";

describe("database config", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("enables TLS for linked Aurora hosts", async () => {
    vi.doMock("sst", () => ({
      Resource: {
        WorkboardPostgres: {
          host: "workboard.cluster-example.us-east-1.rds.amazonaws.com",
          port: 5432,
          username: "postgres",
          password: "secret",
          database: "workboard_mcp",
        },
      },
    }));

    const { getDatabaseConfig } = await import("./config");

    expect(getDatabaseConfig()).toMatchObject({
      host: "workboard.cluster-example.us-east-1.rds.amazonaws.com",
      port: 5432,
      user: "postgres",
      password: "secret",
      database: "workboard_mcp",
      ssl: { rejectUnauthorized: false },
    });
  });

  it("uses Aurora Data API when a linked production cluster exposes ARNs", async () => {
    vi.doMock("sst", () => ({
      Resource: {
        WorkboardPostgres: {
          clusterArn:
            "arn:aws:rds:us-east-1:123456789012:cluster:workboard-production",
          secretArn:
            "arn:aws:secretsmanager:us-east-1:123456789012:secret:workboard",
          host: "workboard.cluster-example.us-east-1.rds.amazonaws.com",
          port: 5432,
          username: "postgres",
          password: "secret",
          database: "workboard_mcp",
        },
      },
    }));

    const { getDatabaseDataApiConfig, shouldUseDatabaseDataApi } =
      await import("./config");

    expect(getDatabaseDataApiConfig()).toEqual({
      database: "workboard_mcp",
      resourceArn:
        "arn:aws:rds:us-east-1:123456789012:cluster:workboard-production",
      secretArn:
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:workboard",
    });
    expect(shouldUseDatabaseDataApi()).toBe(true);
  });

  it("keeps TLS disabled for local Postgres", async () => {
    vi.doMock("sst", () => ({ Resource: {} }));
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://postgres:password@localhost:5432/workboard_mcp",
    );

    const { getDatabaseConfig } = await import("./config");

    expect(getDatabaseConfig()).toMatchObject({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "password",
      database: "workboard_mcp",
      ssl: false,
    });

    const { shouldUseDatabaseDataApi } = await import("./config");

    expect(shouldUseDatabaseDataApi()).toBe(false);
  });
});
