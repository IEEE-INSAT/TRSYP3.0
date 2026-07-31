import type { Metadata } from 'next';
import { Host_Grotesk, Orbitron } from 'next/font/google';
import { AuthProvider } from '@/lib/store/auth-provider';
import { CanonicalHostRedirect } from '@/components/CanonicalHostRedirect';
import './globals.css';

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'TRSYP 3.0 — IEEE Tunisian RAS',
  description: 'IEEE Tunisian RAS Student & Young Professional Congress',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hostGrotesk.variable} ${orbitron.variable}`}>
      <body>
        <CanonicalHostRedirect />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
