import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigType } from "@nestjs/config";
import { AppConfig } from "./configs/app.config.js";
import { OpenApiService } from "./common/openapi/openapi.service.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    routeConflictPolicy: { duplicate: "error", shadow: "warn" },
    routeResolutionStrategy: "specificity",
  });
  const appConfig = app.get<ConfigType<typeof AppConfig>>(AppConfig.KEY);

  app.enableCors(appConfig.cors);

  if (!appConfig.isProduction) {
    const openApiService = app.get(OpenApiService);
    const openApiDocument = openApiService.setup(app);
    openApiService.generateTypesInBackground(openApiDocument);
  }

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8000);
}

await bootstrap();
