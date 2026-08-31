import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { StorageConfig } from "../../configs/storage.config.js";
import { StorageService } from "./storage.service.js";
import { StorageTransport } from "./storage.transport.js";
import { S3Transport } from "./transports/s3.transport.js";

@Module({
  imports: [ConfigModule.forFeature(StorageConfig)],
  providers: [
    {
      provide: StorageTransport,
      inject: [StorageConfig.KEY],
      useFactory: (storageConfig: ConfigType<typeof StorageConfig>) => {
        return new S3Transport(storageConfig);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
