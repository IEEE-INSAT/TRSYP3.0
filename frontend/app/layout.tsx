import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRSYP 3.0 — IEEE Tunisian RAS',
  description: 'IEEE Tunisian RAS Student & Young Professional Congress',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
