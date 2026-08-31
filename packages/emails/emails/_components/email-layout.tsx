import { type ReactNode } from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  pixelBasedPreset,
} from 'react-email';

type EmailLayoutProps = {
  preview: string;
  heading: string;
  children: ReactNode;
};

export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: '#111111',
                muted: '#444444',
                canvas: '#f6f6f6',
              },
            },
          },
        }}
      >
        <Head />
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-canvas py-6 font-sans">
          <Container className="mx-auto max-w-[560px] rounded-[8px] bg-white p-8">
            <Heading className="mb-4 mt-0 text-2xl font-semibold leading-8 text-brand">
              {heading}
            </Heading>
            <Section>{children}</Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
