import * as React from 'react';
import { Html, Body, Container, Heading, Text } from '@react-email/components';

type Props = { name: string };

export const WelcomeEmail = ({ name }: Props) => {
  return (
    <Html>
      <Body style={{ fontFamily: 'Arial' }}>
        <Container>
          <Heading>Welcome, {name} 🎉</Heading>
          <Text>
            We're glad you joined us. Let us know if you need anything!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
