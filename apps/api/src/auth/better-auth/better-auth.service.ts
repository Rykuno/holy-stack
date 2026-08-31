import { Inject, Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import { InjectDrizzle } from '@nest-native/drizzle';
import { AppConfig } from '../../common/configs/app.config.js';
import * as schema from '../../common/database/drizzle.schema.js';
import { type DrizzleClient } from '../../common/database/drizzle.type.js';
import { type ConfigType } from '@nestjs/config';

@Injectable()
export class BetterAuthService {
  readonly auth;

  constructor(
    @InjectDrizzle() private readonly drizzle: DrizzleClient,
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {
    this.auth = betterAuth({
      database: drizzleAdapter(this.drizzle, {
        provider: 'pg',
        schema,
      }),
      baseURL: this.appConfig.baseUrl,
      account: {
        accountLinking: {
          allowDifferentEmails: true,
          enabled: true,
        },
      },
      appName: this.appConfig.name,
    });
  }
}
