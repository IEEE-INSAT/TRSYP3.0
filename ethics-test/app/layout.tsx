import type { Metadata, Viewport } from 'next';
import { Host_Grotesk } from 'next/font/google';
import './globals.css';

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ethical Decision Test · TRSYP 3.0',
  description: 'Allow or override five decisions made by automated systems.',
};

export const viewport: Viewport = { themeColor: '#010008' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hostGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
