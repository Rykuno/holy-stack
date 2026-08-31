import { registerAs } from '@nestjs/config';

export const CacheConfig = registerAs('cache', () => ({
  url: process.env.CACHE_URL!,
}));
