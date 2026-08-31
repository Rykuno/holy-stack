import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { envSchema } from './configs/env.schema.js';
import { AppConfig } from './configs/app.config.js';
import { MailerConfig } from './configs/mailer.config.js';
import { DatabaseModule } from './database/database.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig } from './configs/cache.config.js';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';
import { OpenApiModule } from './openapi/openapi.module.js';
import { MailerModule } from './mailer/mailer.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envSchema,
      validate: (config) => envSchema.parse(config),
      load: [AppConfig, MailerConfig],
      isGlobal: true,
      cache: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule.forFeature(CacheConfig)],
      inject: [CacheConfig.KEY],
      useFactory: (cacheConfig: ConfigType<typeof CacheConfig>) => ({
        stores: [
          new Keyv({
            store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
          }),
          createKeyv(cacheConfig.url),
        ],
      }),
    }),
    DatabaseModule,
    OpenApiModule,
    MailerModule,
  ],
  exports: [MailerModule],
})
export class CommonModule {}
