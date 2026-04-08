import type { Metadata } from 'next';
import './globals.css';
import { Auth0ProviderWrapper } from '@/context/Auth0ProviderWrapper';
import { AuthProvider } from '@/context/AuthContext';
import { MSWProvider } from '@/mocks/MSWProvider';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import { NotificationProvider } from '@/context/NotificationContext';
import { LanguageProvider } from '@/context/LanguageContext';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MangaTK',
  description: 'Your favorite manga website',
  icons: {
    icon: 'https://i.ibb.co/NnyJ7LWB/071d3330ff30.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <ToastProvider />
        <MSWProvider>
          <Auth0ProviderWrapper>
            <AuthProvider>
              <NotificationProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
              </NotificationProvider>
            </AuthProvider>
          </Auth0ProviderWrapper>
        </MSWProvider>
      </body>
    </html>
  );
}
