import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
