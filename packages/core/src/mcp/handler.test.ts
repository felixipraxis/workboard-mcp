import { afterEach, describe, expect, it, vi } from "vitest";

describe("MCP protected resource metadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("exposes path-scoped metadata through the Better Auth resource client", async () => {
    const getProtectedResourceMetadata = vi.fn(async (metadata) => metadata);

    vi.doMock("@better-auth/oauth-provider", () => ({
      mcpHandler: vi.fn((_verifyOptions, handler) => handler),
    }));
    vi.doMock("@better-auth/oauth-provider/resource-client", () => ({
      oauthProviderResourceClient: vi.fn(() => ({
        getActions: () => ({ getProtectedResourceMetadata }),
      })),
    }));
    vi.doMock("../auth/auth", () => ({ auth: {} }));
    vi.doMock("../config", () => ({
      getAuthIssuer: () => "https://workboard.example.test/api/auth",
      getMcpResourceUrl: () => "https://workboard.example.test/mcp",
    }));
    vi.doMock("./workboard", () => ({
      registerWorkboardTools: vi.fn(),
    }));
    vi.doMock("mcp-handler", () => ({
      createMcpHandler: vi.fn(() => vi.fn()),
    }));

    const {
      workboardMcpResourceMetadataPath,
      workboardProtectedResourceHandler,
    } = await import("./handler");

    const response = await workboardProtectedResourceHandler();

    expect(workboardMcpResourceMetadataPath).toBe(
      "/.well-known/oauth-protected-resource/mcp",
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    await expect(response.json()).resolves.toEqual({
      resource: "https://workboard.example.test/mcp",
      authorization_servers: ["https://workboard.example.test/api/auth"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["workboard:read", "workboard:write"],
    });
    expect(getProtectedResourceMetadata).toHaveBeenCalledWith({
      resource: "https://workboard.example.test/mcp",
      authorization_servers: ["https://workboard.example.test/api/auth"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["workboard:read", "workboard:write"],
    });
  });

  it("delegates bearer verification to Better Auth before attaching MCP auth context", async () => {
    const payload = {
      sub: "user_123",
      azp: "client_123",
      scope: "openid workboard:read",
      exp: 1782165600,
    };
    const mcpHandler = vi.fn((_verifyOptions, handler) => {
      return (request: Request) => handler(request, payload);
    });
    const rawMcpHandler = vi.fn(async (request: Request) =>
      Response.json({ auth: request.auth }),
    );

    vi.doMock("@better-auth/oauth-provider", () => ({ mcpHandler }));
    vi.doMock("@better-auth/oauth-provider/resource-client", () => ({
      oauthProviderResourceClient: vi.fn(() => ({
        getActions: () => ({
          getProtectedResourceMetadata: vi.fn(),
        }),
      })),
    }));
    vi.doMock("../auth/auth", () => ({ auth: {} }));
    vi.doMock("../config", () => ({
      getAuthIssuer: () => "https://workboard.example.test/api/auth",
      getMcpResourceUrl: () => "https://workboard.example.test/mcp",
    }));
    vi.doMock("./workboard", () => ({
      registerWorkboardTools: vi.fn(),
    }));
    vi.doMock("mcp-handler", () => ({
      createMcpHandler: vi.fn(() => rawMcpHandler),
    }));

    const { authenticatedMcpHandler } = await import("./handler");

    const response = await authenticatedMcpHandler(
      new Request("https://workboard.example.test/mcp", {
        headers: { authorization: "Bearer jwt-token" },
      }),
    );

    expect(mcpHandler).toHaveBeenCalledWith(
      {
        jwksUrl: "https://workboard.example.test/api/auth/jwks",
        verifyOptions: {
          audience: "https://workboard.example.test/mcp",
          issuer: "https://workboard.example.test/api/auth",
        },
        scopes: ["workboard:read"],
      },
      expect.any(Function),
    );
    expect(rawMcpHandler).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      auth: {
        token: "jwt-token",
        clientId: "client_123",
        scopes: ["openid", "workboard:read"],
        expiresAt: 1782165600,
        resource: "https://workboard.example.test/mcp",
        extra: { userId: "user_123" },
      },
    });
  });
});
