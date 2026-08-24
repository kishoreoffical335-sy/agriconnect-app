import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriConnect FPO — Speak. Aggregate. Sell. Know What You Earn.',
  description:
    'A transparent multi-user agricultural supply chain connecting farmers, FPOs, buyers, and logistics partners.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <span className="font-bold text-slate-700">AgriConnect FPO</span> — Smart India Hackathon Prototype
            </p>
            <p className="text-emerald-700 font-medium">
              &quot;Speak. Aggregate. Sell. Know What You Earn.&quot;
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
