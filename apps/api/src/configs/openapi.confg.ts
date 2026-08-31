import { registerAs } from "@nestjs/config";

export const OpenApiConfig = registerAs("openapi", () => ({
  title: "API",
  description: "API",
  version: "1.0.0",
  path: "/api/docs",
  outputPath: "generated/openapi.d.ts",
}));
