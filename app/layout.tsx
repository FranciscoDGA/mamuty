import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Mamuty Barbearia - Agende seu Horário',
  description: 'Agende seu horário na Barbearia Mamuty. Estilo forte em Cumaru do Norte - PA.',
  applicationName: 'Mamuty',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mamuty',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Mamuty Barbearia - Agende seu Horário',
    description: 'Agende seu horário na Barbearia Mamuty. Estilo forte em Cumaru do Norte - PA.',
    type: 'website',
    siteName: 'Mamuty Barbearia',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Mamuty Barbearia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mamuty Barbearia - Agende seu Horário',
    description: 'Agende seu horário na Barbearia Mamuty. Estilo forte em Cumaru do Norte - PA.',
  },
};

import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#070a12] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

