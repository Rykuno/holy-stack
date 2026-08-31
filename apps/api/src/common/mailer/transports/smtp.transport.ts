import { type ConfigType } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import { type MailerConfig } from "../../../configs/mailer.config.js";
import { MailerTransport } from "../mailer.transport.js";
import { type SendMailMessage } from "../mailer.types.js";

export class SmtpTransport extends MailerTransport {
  private readonly transporter: Transporter;

  constructor(private readonly mailerConfig: ConfigType<typeof MailerConfig>) {
    super();
    this.transporter = nodemailer.createTransport({
      host: mailerConfig.smtp.host,
      port: mailerConfig.smtp.port,
    });
  }

  async send(message: SendMailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.mailerConfig.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
