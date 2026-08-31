import { render } from 'react-email';
import PasswordResetEmail, {
  type PasswordResetEmailProps,
} from '../emails/password-reset-email.tsx';
import VerificationEmail, { type VerificationEmailProps } from '../emails/verification-email.tsx';

export { PasswordResetEmail, type PasswordResetEmailProps };
export { VerificationEmail, type VerificationEmailProps };

export type RenderedEmail = {
  html: string;
  text: string;
};

export async function renderVerificationEmail(
  props: VerificationEmailProps,
): Promise<RenderedEmail> {
  const template = VerificationEmail(props);

  return {
    html: await render(template),
    text: await render(template, { plainText: true }),
  };
}

export async function renderPasswordResetEmail(
  props: PasswordResetEmailProps,
): Promise<RenderedEmail> {
  const template = PasswordResetEmail(props);

  return {
    html: await render(template),
    text: await render(template, { plainText: true }),
  };
}
