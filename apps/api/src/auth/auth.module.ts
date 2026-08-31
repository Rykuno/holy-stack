import { Module } from '@nestjs/common';
import { BetterAuthController } from './better-auth/better-auth.controller.js';
import { BetterAuthService } from './better-auth/better-auth.service.js';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from '../common/configs/app.config.js';

@Module({
  imports: [ConfigModule.forFeature(AppConfig)],
  controllers: [BetterAuthController],
  providers: [BetterAuthService],
})
export class AuthModule {}
