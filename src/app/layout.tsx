import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import LocalizationRuntime from '@/components/LocalizationRuntime';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriConnect — Connect. Aggregate. Grow Together.',
  description: 'A farmer-first agricultural marketplace connecting farmers, FPOs, buyers and logistics with smart matching and transparent settlement.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${inter.className} min-h-screen bg-[#f7fbf3] text-slate-900`}>
        <Navbar />
        <LocalizationRuntime />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
