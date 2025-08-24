import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ReviewItem {
  id: string;
  title: string;
  store_name?: string;
  price?: number;
  created_at: string;
}

interface ReviewReminderEmailProps {
  reviewItems: ReviewItem[];
  appUrl: string;
  longPausedCount: number;
}

export const ReviewReminderEmail = ({
  reviewItems,
  appUrl,
  longPausedCount,
}: ReviewReminderEmailProps) => {

  return (
    <Html>
      <Head />
      <Preview>
        {reviewItems.length} item{reviewItems.length > 1 ? 's' : ''} {reviewItems.length > 1 ? 'are' : 'is'} ready whenever you are.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerSubtitle}>
              {reviewItems.length} item{reviewItems.length > 1 ? 's' : ''} {reviewItems.length > 1 ? 'are' : 'is'} ready whenever you are.
            </Text>
          </Section>

          {/* Brand */}
          <Section style={brandSection}>
            <Heading style={brandTitle}>Pocket Pause</Heading>
            <Text style={brandSubtitle}>Your paused items are ready for review.</Text>
            <Text style={introText}>
              Here's what's been waiting for you. Take a breath and choose with clarity.
            </Text>
          </Section>

          {/* Items Count */}
          <Section style={countSection}>
            <Text style={countText}>
              You have <strong>{reviewItems.length}</strong> item{reviewItems.length > 1 ? 's' : ''} ready for review.
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href={appUrl}>
              Review Now →
            </Button>
          </Section>

          {/* Long Paused Notice */}
          {longPausedCount > 0 && (
            <Section style={noticeSection}>
              <Text style={noticeText}>
                ✦ Notice: {longPausedCount} of these items {longPausedCount > 1 ? 'have' : 'has'} been paused for more than 10 days. {longPausedCount > 1 ? 'Do they' : 'Does it'} still hold meaning?
              </Text>
            </Section>
          )}

          {/* Inspirational Quote */}
          <Section style={quoteSection}>
            <Text style={quoteText}>
              Clarity grows in pauses. Thanks for taking yours.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Link href={appUrl} style={footerLink}>
              Manage account / settings
            </Link>
            <Text style={footerSubtext}>
              Pocket-sized presence before you buy.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReviewReminderEmail

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const headerSubtitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const brandSection = {
  marginBottom: '32px',
}

const brandTitle = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'left' as const,
}

const brandSubtitle = {
  color: '#8B5CF6',
  fontStyle: 'italic',
  margin: '0 0 16px 0',
  fontSize: '18px',
  textAlign: 'left' as const,
}

const introText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  textAlign: 'left' as const,
}

const countSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
  borderRadius: '12px',
  padding: '24px',
  borderLeft: '4px solid #8B5CF6',
}

const countText = {
  color: '#333',
  fontSize: '18px',
  lineHeight: '1.5',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  border: 'none',
}

const noticeSection = {
  background: 'linear-gradient(135deg, #fff9e6 0%, #fef3c7 100%)',
  border: '1px solid #f59e0b',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const noticeText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
}

const quoteSection = {
  textAlign: 'center' as const,
  margin: '40px 0 24px 0',
}

const quoteText = {
  color: '#666',
  fontStyle: 'italic',
  margin: '0',
  fontSize: '18px',
  lineHeight: '1.5',
}

const divider = {
  borderColor: '#eee',
  margin: '32px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#8B5CF6',
  fontSize: '12px',
  textDecoration: 'none',
  margin: '0 0 8px 0',
  display: 'block',
}

const footerSubtext = {
  color: '#ccc',
  fontSize: '11px',
  margin: '8px 0 0 0',
}