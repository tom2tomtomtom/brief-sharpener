import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Brief Intelligence runs on AIDEN tokens. 200 free on sign-up. 20 tokens per full analysis, 5 per generation. One shared balance across every AIDEN tool.',
}

export default function PricingPage() {
  return <PricingClient />
}
