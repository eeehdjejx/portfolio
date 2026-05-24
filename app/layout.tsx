import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elshaikh Productivity OS',
  description: 'A professional productivity operating system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased overflow-hidden">{children}</body>
    </html>
  );
}
