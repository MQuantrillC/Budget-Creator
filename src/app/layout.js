import { Inter } from 'next/font/google';
import './globals.css';
import { BudgetProvider } from '@/context/BudgetContext';
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import AuthGuard from '@/components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${inter.className} font-sans transition-colors duration-200`}>
        <BudgetProvider>
          <AuthProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <Toaster position="bottom-right" />
              </div>
            </AuthGuard>
          </AuthProvider>
        </BudgetProvider>
      </body>
    </html>
  );
} 