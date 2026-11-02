import './globals.css';
import { Plus_Jakarta_Sans, Cairo } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" className={`${jakarta.variable} ${cairo.variable}`}>
      <body className="font-sans antialiased text-slate-700 bg-slate-50">
        {children}
      </body>
    </html>
  );
}