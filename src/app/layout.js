import { Fraunces, Libre_Franklin, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { BudgetProvider } from '@/context/BudgetContext';
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import AuthGuard from '@/components/AuthGuard';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '600', '700'],
});

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre',
  weight: ['400', '500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4eedf',
};

export const metadata = {
  title: 'Budget Creator',
  description: 'A personal budgeting tool to project your finances.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${libreFranklin.variable} ${plexMono.variable}`}>
      <body>
        <AuthProvider>
          <BudgetProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: '#faf6ea',
                      color: '#2b2822',
                      border: '1px solid #b9ac8c',
                      fontFamily: 'var(--font-plex-mono)',
                      fontSize: '13px',
                    },
                  }}
                />
              </div>
            </AuthGuard>
          </BudgetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
