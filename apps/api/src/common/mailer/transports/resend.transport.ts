import { type ConfigType } from '@nestjs/config';
import { Resend } from 'resend';
import { type MailerConfig } from '../../configs/mailer.config.js';
import { MailerTransport } from '../mailer.transport.js';
import { type SendMailMessage } from '../mailer.types.js';

export class ResendTransport extends MailerTransport {
  private readonly resend: Resend;

  constructor(private readonly mailerConfig: ConfigType<typeof MailerConfig>) {
    super();
    this.resend = new Resend(mailerConfig.resend.apiKey);
  }

  async send(message: SendMailMessage): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.mailerConfig.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
