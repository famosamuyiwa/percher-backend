import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type Props = { otp: string };

export function VerificationEmail({ otp }: Props) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Verify your email to get started on Percher</Preview>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={imageSection}>
              <Img
                src={`https://tabbie.africa/splash-icon-light-2.png`}
                width="100"
                height="100"
                alt="Percher Logo"
              />
            </Section>
            <Section style={upperSection}>
              <Heading style={h1}>Verify your email address</Heading>
              <Text style={mainText}>
                Welcome to Percher! To continue setting up your account, please
                enter the verification code below when prompted in the app. If
                you didn't request this, feel free to ignore this email.
              </Text>
              <Section style={verificationSection}>
                <Text style={verifyText}>Your verification code</Text>
                <Text style={codeText}>{otp}</Text>
                <Text style={validityText}>
                  (This code is valid for 10 minutes)
                </Text>
              </Section>
            </Section>
            <Hr />
            <Section style={lowerSection}>
              <Text style={cautionText}>
                Percher will never ask for your password, banking details, or
                verification code outside of our app.
              </Text>
            </Section>
          </Section>
          <Text style={footerText}>
            This email was sent by Percher, a platform that makes finding and
            renting homes easier across Africa. All rights reserved. Learn more
            at{' '}
            <Link href="https://percher.africa" target="_blank" style={link}>
              percher.africa
            </Link>
            . View our{' '}
            <Link
              href="https://percher.africa/privacy"
              target="_blank"
              style={link}
            >
              privacy policy
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fff',
  color: '#212121',
};

const container = {
  padding: '20px',
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px',
};

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
};

const imageSection = {
  backgroundColor: '#1F2430',
  textAlign: 'center' as const,
  paddingLeft: '20px',
};

const coverSection = { backgroundColor: '#fff' };

const upperSection = { padding: '25px 35px' };

const lowerSection = { padding: '25px 35px' };

const footerText = {
  ...text,
  fontSize: '12px',
  padding: '0 20px',
};

const verifyText = {
  ...text,
  margin: 0,
  fontWeight: 'bold',
  textAlign: 'center' as const,
};

const codeText = {
  ...text,
  fontWeight: 'bold',
  fontSize: '36px',
  margin: '10px auto',
  textAlign: 'center' as const,
  letterSpacing: '8px',
  backgroundColor: '#f4f4f4',
  padding: '10px 20px',
  borderRadius: '4px',
  display: 'inline-block',
};

const validityText = {
  ...text,
  margin: '0px',
  textAlign: 'center' as const,
};

const verificationSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const mainText = { ...text, marginBottom: '14px' };

const cautionText = { ...text, margin: '0px' };
