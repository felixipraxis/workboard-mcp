export const rootDomain = "workboard-mcp.praxismedicines.dev";

const productionStages = new Set(["production", "prod"]);

export function isProductionStage(stage: string | undefined) {
  return productionStages.has((stage ?? "").toLowerCase());
}

export function stageDomainLabel(stage: string | undefined) {
  const label = (stage ?? "dev")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63)
    .replace(/^-|-$/g, "");

  return label || "dev";
}

export function publicDomainForStage(stage: string | undefined) {
  return isProductionStage(stage)
    ? rootDomain
    : `${stageDomainLabel(stage)}.${rootDomain}`;
}

export function publicBaseUrlForStage(stage: string | undefined) {
  return `https://${publicDomainForStage(stage)}`;
}
