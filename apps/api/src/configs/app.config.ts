import { CorsOptions } from '@nestjs/common/internal';
import { registerAs } from '@nestjs/config';

export const AppConfig = registerAs('app', () => ({
  name: process.env.APP_NAME! || 'api',
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL!,
  webUrl: process.env.WEB_URL!,
  isProduction: process.env.NODE_ENV === 'production',
  cors: {
    origin: process.env.WEB_URL!,
    methods: ['GET', 'PATCH', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'user-agent', 'Accept'],
    credentials: true,
  } satisfies CorsOptions,
}));
