import type { Metadata } from 'next'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://aiden.services'

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIDEN Landing Page Generator',
    description: 'AI-powered landing page copy generator with live preview. Create high-converting landing pages in seconds.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
