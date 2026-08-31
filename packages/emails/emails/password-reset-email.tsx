import { Button, Text } from 'react-email';
import { EmailLayout } from './_components/email-layout.tsx';

export type PasswordResetEmailProps = {
  url: string;
};

export function PasswordResetEmail({ url }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password" heading="Reset your password">
      <Text className="m-0 mb-4 text-base leading-6 text-muted">
        Click the button below to choose a new password. This link expires soon.
      </Text>
      <Button
        href={url}
        className="inline-block rounded-[6px] bg-brand px-5 py-3 text-base font-semibold text-white no-underline"
      >
        Reset password
      </Button>
      <Text className="m-0 mb-4 text-base leading-6 text-muted">
        If you did not request a password reset, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  url: 'https://example.com/reset',
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
