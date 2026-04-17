import type { Metadata, Viewport } from 'next'
import { validateEnvOnStartup } from '@/lib/env'
import { GoogleAnalytics } from '@/components/Analytics'
import Footer from '@/components/Footer'
import './globals.css'

validateEnvOnStartup()

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://brief-sharpener.aiden.services'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'AIDEN Brief Intelligence | AI-Powered Brief Analysis',
    template: '%s | AIDEN',
  },
  description: 'Paste your brief. AIDEN interrogates it with AI-powered creative analysis. Get gaps identified and a sharper brief back in seconds.',
  metadataBase: new URL(siteUrl),
  manifest: '/manifest.json',
  icons: {
    apple: '/icon',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'AIDEN',
    title: 'AIDEN Brief Intelligence | AI-Powered Brief Analysis',
    description: 'Paste your brief. AIDEN interrogates it with AI-powered creative analysis. Get gaps identified and a sharper brief back in seconds.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AIDEN Brief Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIDEN Brief Intelligence | AI-Powered Brief Analysis',
    description: 'Paste your brief. AIDEN interrogates it with AI-powered creative analysis. Get gaps identified and a sharper brief back in seconds.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-red-hot focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <Footer />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
