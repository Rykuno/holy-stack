import { Global, Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import * as schema from './drizzle.schema.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { relations } from './drizzle.relations.js';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { DatabaseConfig } from '../configs/database.config.js';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { getDrizzleClientToken } from '@nest-native/drizzle';

@Global()
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule.forFeature(DatabaseConfig)],
      inject: [DatabaseConfig.KEY],
      useFactory: (databaseConfig: ConfigType<typeof DatabaseConfig>) => {
        const client = new Pool({
          connectionString: databaseConfig.url,
        });

        return {
          schema,
          connection: drizzle({ relations, client }),
          shutdown: () => client.end(),
        };
      },
    }),
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: getDrizzleClientToken(),
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
})
export class DatabaseModule {}
