// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { MSWProvider } from '@/mocks/MSWProvider';
import { Inter } from 'next/font/google';
import OneSignalInit from '@/components/OneSignalInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MangaTK',
  description: 'Your favorite manga website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <OneSignalInit />
        <MSWProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
