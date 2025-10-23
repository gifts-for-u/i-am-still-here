import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Halo Cantik Aku',
  description: 'Sebuah halaman romantis interaktif untuk orang tersayang.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={figtree.className}>{children}</body>
    </html>
  );
}
