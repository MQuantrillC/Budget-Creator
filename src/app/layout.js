import { Inter } from 'next/font/google';
import './globals.css';
import { BudgetProvider } from '@/context/BudgetContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Budget Creator',
  description: 'A personal budgeting tool to project your finances.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans`}>
        <BudgetProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
            <Toaster position="bottom-right" />
          </div>
        </BudgetProvider>
      </body>
    </html>
  );
} 