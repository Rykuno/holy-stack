import { type SendMailMessage } from './mailer.types.js';

export abstract class MailerTransport {
  abstract send(message: SendMailMessage): Promise<void>;
}
