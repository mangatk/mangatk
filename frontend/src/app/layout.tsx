// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Auth0ProviderWrapper } from '@/context/Auth0ProviderWrapper';
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
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {/* <OneSignalInit /> */}
        <MSWProvider>
          <Auth0ProviderWrapper>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Auth0ProviderWrapper>
        </MSWProvider>
      </body>
    </html>
  );
}
