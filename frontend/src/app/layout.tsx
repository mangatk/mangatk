// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // استيراد
import { Inter } from 'next/font/google';
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
        {/* تغليف التطبيق هنا */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}