import { Injectable } from "@nestjs/common";
import { renderPasswordResetEmail, renderVerificationEmail } from "emails";
import { MailerTransport } from "./mailer.transport.js";
import {
  type SendMailMessage,
  type SendPasswordResetEmailInput,
  type SendVerificationEmailInput,
} from "./mailer.types.js";

@Injectable()
export class MailerService {
  constructor(private readonly transport: MailerTransport) {}

  send(message: SendMailMessage): Promise<void> {
    return this.transport.send(message);
  }

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    const { html, text } = await renderVerificationEmail({ url: input.url });

    await this.send({
      to: input.to,
      subject: "Verify your email",
      html,
      text,
    });
  }

  async sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
    const { html, text } = await renderPasswordResetEmail({ url: input.url });

    await this.send({
      to: input.to,
      subject: "Reset your password",
      html,
      text,
    });
  }
}
