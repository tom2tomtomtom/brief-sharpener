import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { validateEnvOnStartup } from '@/lib/env'
import './globals.css'

validateEnvOnStartup()

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://aiden.services'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'AIDEN Landing Page Generator',
    template: '%s | AIDEN',
  },
  description: 'AI-powered landing page copy generator with live preview. Create high-converting landing pages in seconds.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'AIDEN',
    title: 'AIDEN Landing Page Generator',
    description: 'AI-powered landing page copy generator with live preview. Create high-converting landing pages in seconds.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AIDEN Landing Page Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIDEN Landing Page Generator',
    description: 'AI-powered landing page copy generator with live preview. Create high-converting landing pages in seconds.',
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
