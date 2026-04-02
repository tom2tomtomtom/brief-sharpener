import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free with 1 analysis per month. Upgrade to Starter ($49 for 10 analyses) or Pro ($99/mo unlimited) for full strategic output and no branding.',
}

export default function PricingPage() {
  return <PricingClient />
}
