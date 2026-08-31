export type SendMailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendVerificationEmailInput = {
  to: string;
  url: string;
};

export type SendPasswordResetEmailInput = {
  to: string;
  url: string;
};
