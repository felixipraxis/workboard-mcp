/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    const { isProductionStage } = await import("./infra/stage");
    const stage = input?.stage;

    return {
      name: "workboard-mcp",
      removal: isProductionStage(stage) ? "retain" : "remove",
      protect: isProductionStage(stage),
      home: "aws",
      providers: {
        cloudflare: { package: "@pulumi/cloudflare", version: "6.17.0" },
      },
    };
  },
  async run() {
    const api = await import("./infra/api");

    return {
      ApiUrl: api.apiUrl,
      ServiceUrl: api.api.url,
      PublicBaseUrl: api.publicBaseUrl,
      DatabaseHost: api.database.host,
    };
  },
});
