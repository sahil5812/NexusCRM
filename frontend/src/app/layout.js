import '../styles/globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const metadata = {
  title: 'NexusCRM - AI-Powered Multi-Agent CRM',
  description: 'A premium, modern AI-Powered CRM system featuring autonomous agents for Lead Scoring, Email Automation, Customer Support, and Analytics.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
