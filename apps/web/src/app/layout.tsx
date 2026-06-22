import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lobos de la Aldea',
  description: 'Juego social de deducción multijugador',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
