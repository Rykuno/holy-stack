import z from 'zod/v4';

export const envSchema = z
  .object({
    APP_NAME: z.string(),
    PORT: z.coerce.number().default(8000),
    BASE_URL: z.string(),
    WEB_URL: z.string(),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    MAILER_FROM: z.string(),
    MAILER_DRIVER: z.enum(['smtp', 'resend']).optional(),
    MAILER_SMTP_HOST: z.string().default('localhost'),
    MAILER_SMTP_PORT: z.coerce.number().default(1025),
    RESEND_API_KEY: z.string().optional(),
    STORAGE_URL: z.url().optional(),
    STORAGE_REGION: z.string().default('us-east-1'),
    STORAGE_ACCESS_KEY: z.string(),
    STORAGE_SECRET_KEY: z.string(),
    STORAGE_PUBLIC_BUCKET: z.string(),
    STORAGE_PRIVATE_BUCKET: z.string(),
    STORAGE_PUBLIC_URL: z.url().optional(),
    STORAGE_FORCE_PATH_STYLE: z.enum(['true', 'false']).optional(),
  })
  .superRefine((env, ctx) => {
    const driver = env.MAILER_DRIVER ?? (env.NODE_ENV === 'production' ? 'resend' : 'smtp');

    if (driver === 'resend' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when using the resend mailer driver',
      });
    }

    if (env.STORAGE_PUBLIC_BUCKET === env.STORAGE_PRIVATE_BUCKET) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_PUBLIC_BUCKET'],
        message: 'STORAGE_PUBLIC_BUCKET and STORAGE_PRIVATE_BUCKET must be different',
      });
    }
  });
