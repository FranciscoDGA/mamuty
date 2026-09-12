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
  title: 'Mamuty - Barbearia & Salão Masculino',
  description: 'App PWA de agendamento online, galeria de fotos e portfólio dos barbeiros, notificações via WhatsApp, pagamentos integrados, programa de fidelidade e gestão da Barbearia Mamuty.',
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
    title: 'Mamuty - Barbearia & Salão Masculino',
    description: 'App PWA de agendamento online, galeria de fotos e portfólio dos barbeiros, notificações via WhatsApp, pagamentos integrados, programa de fidelidade e gestão da Barbearia Mamuty.',
    type: 'website',
    siteName: 'Mamuty Barbearia',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mamuty - Barbearia & Salão Masculino',
    description: 'App PWA de agendamento online, galeria de fotos e portfólio dos barbeiros, notificações via WhatsApp e fidelidade.',
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

