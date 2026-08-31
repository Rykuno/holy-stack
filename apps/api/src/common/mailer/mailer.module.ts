import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service.js';

@Module({
  providers: [MailerService]
})
export class MailerModule {}
