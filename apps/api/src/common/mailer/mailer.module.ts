import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { MailerConfig } from "../configs/mailer.config.js";
import { MailerService } from "./mailer.service.js";
import { MailerTransport } from "./mailer.transport.js";
import { ResendTransport } from "./transports/resend.transport.js";
import { SmtpTransport } from "./transports/smtp.transport.js";

@Module({
  imports: [ConfigModule.forFeature(MailerConfig)],
  providers: [
    {
      provide: MailerTransport,
      inject: [MailerConfig.KEY],
      useFactory: (mailerConfig: ConfigType<typeof MailerConfig>) => {
        if (mailerConfig.driver === "resend") return new ResendTransport(mailerConfig);
        return new SmtpTransport(mailerConfig);
      },
    },
    MailerService,
  ],
  exports: [MailerService, MailerTransport],
})
export class MailerModule {}
