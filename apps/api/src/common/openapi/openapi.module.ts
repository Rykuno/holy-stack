import { Module } from '@nestjs/common';
import { OpenApiService } from './openapi.service.js';

@Module({
  providers: [OpenApiService],
})
export class OpenApiModule {}
