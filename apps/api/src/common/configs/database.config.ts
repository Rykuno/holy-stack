import { registerAs } from '@nestjs/config';

export const DatabaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
