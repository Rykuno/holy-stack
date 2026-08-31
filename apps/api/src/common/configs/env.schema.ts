import z from 'zod/v4';

export const envSchema = z.object({
  APP_NAME: z.string(),
  PORT: z.coerce.number().default(8000),
  BASE_URL: z.string(),
  WEB_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});
