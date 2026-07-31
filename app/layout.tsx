import type { Metadata } from 'next';
import { Host_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/lib/store/auth-provider';
import './globals.css';

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
});

export const metadata: Metadata = {
  title: 'TRSYP 3.0 - IEEE Tunisian RAS',
  description: 'IEEE Tunisian RAS Student & Young Professional Congress',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hostGrotesk.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
