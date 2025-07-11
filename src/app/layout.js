import Link from 'next/link';
import './globals.css';
import { BudgetProvider } from '@/context/BudgetContext';

export const metadata = {
  title: 'Budget Creator',
  description: 'Create and manage your budget with ease.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <BudgetProvider>
        <body>
          <nav className="p-4 bg-gray-100">
            <ul className="flex space-x-4">
              <li>
                <Link href="/">Dashboard</Link>
              </li>
              <li>
                <Link href="/entries">Entries</Link>
              </li>
              <li>
                <Link href="/settings">Settings</Link>
              </li>
            </ul>
          </nav>
          <main className="p-4">{children}</main>
        </body>
      </BudgetProvider>
    </html>
  );
} 