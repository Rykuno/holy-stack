import { Module } from "@nestjs/common";
import { OpenApiService } from "./openapi.service.js";
import { OpenApiConfig } from "../../configs/openapi.confg.js";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule.forFeature(OpenApiConfig)],
  providers: [OpenApiService],
})
export class OpenApiModule {}
