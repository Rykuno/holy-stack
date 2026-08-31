import { registerAs } from '@nestjs/config';

export const MailerConfig = registerAs('mailer', () => ({
  driver:
    (process.env.MAILER_DRIVER as 'smtp' | 'resend' | undefined) ??
    (process.env.NODE_ENV === 'production' ? 'resend' : 'smtp'),
  from: process.env.MAILER_FROM!,
  smtp: {
    host: process.env.MAILER_SMTP_HOST ?? 'localhost',
    port: Number(process.env.MAILER_SMTP_PORT ?? 1025),
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
}));
