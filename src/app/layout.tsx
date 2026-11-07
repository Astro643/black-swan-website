import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// ============================================
// FONT CONFIGURATION
// ============================================

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// ============================================
// METADATA
// ============================================

export const metadata: Metadata = {
  title: {
    default: 'Black Swan - Stock Market Game',
    template: '%s | Black Swan',
  },
  description: 'A high-concurrency Discord & Web Stock Market & Financial Crash Economy Game',
  keywords: ['stock market', 'game', 'discord', 'finance', 'economy', 'trading'],
  authors: [{ name: 'Astro643' }],
  creator: 'Astro643',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_RENDER_EXTERNAL_URL || 'https://blackswan.game',
    siteName: 'Black Swan',
    title: 'Black Swan - Stock Market Game',
    description: 'A high-concurrency Discord & Web Stock Market & Financial Crash Economy Game',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Black Swan Stock Market Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Black Swan - Stock Market Game',
    description: 'A high-concurrency Discord & Web Stock Market & Financial Crash Economy Game',
    images: ['/og-image.png'],
    creator: '@Astro643',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#4B0082',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// ============================================
// ROOT LAYOUT COMPONENT
// ============================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
