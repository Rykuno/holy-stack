import { registerAs } from '@nestjs/config';

export const StorageConfig = registerAs('storage', () => ({
  url: process.env.STORAGE_URL,
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  accessKey: process.env.STORAGE_ACCESS_KEY!,
  secretKey: process.env.STORAGE_SECRET_KEY!,
  publicBucket: process.env.STORAGE_PUBLIC_BUCKET!,
  privateBucket: process.env.STORAGE_PRIVATE_BUCKET!,
  publicUrl: process.env.STORAGE_PUBLIC_URL,
  forcePathStyle:
    process.env.STORAGE_FORCE_PATH_STYLE === 'true' ||
    (process.env.STORAGE_FORCE_PATH_STYLE !== 'false' && Boolean(process.env.STORAGE_URL)),
  corsOrigins: process.env.WEB_URL ? [process.env.WEB_URL] : [],
  putExpiresInSeconds: 600,
  getExpiresInSeconds: 900,
  provision: process.env.NODE_ENV !== 'production',
}));
