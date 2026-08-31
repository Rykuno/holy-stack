import { Button, Text } from 'react-email';
import { EmailLayout } from './_components/email-layout.tsx';

export type VerificationEmailProps = {
  url: string;
};

export function VerificationEmail({ url }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your email address" heading="Verify your email">
      <Text className="m-0 mb-4 text-base leading-6 text-muted">
        Click the button below to verify your email address.
      </Text>
      <Button
        href={url}
        className="inline-block rounded-[6px] bg-brand px-5 py-3 text-base font-semibold text-white no-underline"
      >
        Verify email
      </Button>
      <Text className="m-0 mb-4 text-base leading-6 text-muted">
        If you did not create an account, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerificationEmail.PreviewProps = {
  url: 'https://example.com/verify',
} satisfies VerificationEmailProps;

export default VerificationEmail;
