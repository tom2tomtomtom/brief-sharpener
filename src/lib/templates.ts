export type TemplateId = 'saas' | 'agency' | 'freelancer' | 'ecommerce' | 'local-business'

export interface PreviewTheme {
  heroGradient: string
  heroSubtext: string
  ctaButton: string
  ctaButtonText: string
  featureIconBg: string
  featureHover: string
  featuresHeading: string
  featuresSubtext: string
  footerBg: string
}

export interface Template {
  id: TemplateId
  label: string
  description: string
  defaultTone: 'professional' | 'casual' | 'bold' | 'minimal'
  promptInstructions: string
  previewTheme: PreviewTheme
}

export const TEMPLATES: Template[] = [
  {
    id: 'saas',
    label: 'SaaS',
    description: 'Software product with features, integrations, free trial',
    defaultTone: 'professional',
    promptInstructions: `You are writing copy for a SaaS product landing page.
- Lead with the core transformation or outcome the software delivers
- Headline should convey speed, automation, or competitive advantage
- Features should emphasize time saved, integrations, and measurable ROI
- FAQ should address pricing, data security, onboarding, and cancellation
- CTA should offer a free trial, demo, or "Get started" action
- Social proof should reference number of teams, companies, or data processed
- Use confident, benefit-driven language throughout`,
    previewTheme: {
      heroGradient: 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900',
      heroSubtext: 'text-indigo-200',
      ctaButton: 'bg-white text-indigo-700 hover:bg-indigo-50',
      ctaButtonText: 'text-indigo-700',
      featureIconBg: 'bg-indigo-100',
      featureHover: 'hover:border-indigo-100 hover:bg-indigo-50/40',
      featuresHeading: 'Everything you need to scale',
      featuresSubtext: 'Purpose-built tools that grow with your business.',
      footerBg: 'bg-gray-900',
    },
  },
  {
    id: 'agency',
    label: 'Agency',
    description: 'Creative or digital agency showcasing work and expertise',
    defaultTone: 'bold',
    promptInstructions: `You are writing copy for a creative or digital agency landing page.
- Headline should be bold, memorable, and position the agency as a leader
- Subheadline should articulate what the agency does and for whom
- Features should be framed as service offerings or agency capabilities (e.g. strategy, design, development)
- FAQ should address process, timelines, pricing model, and what clients can expect
- CTA should invite prospects to book a call, see work, or start a project
- Social proof should mention notable clients, industries served, or projects delivered
- Use confident, creative, and authoritative language`,
    previewTheme: {
      heroGradient: 'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900',
      heroSubtext: 'text-gray-400',
      ctaButton: 'bg-white text-gray-900 hover:bg-gray-100',
      ctaButtonText: 'text-gray-900',
      featureIconBg: 'bg-gray-100',
      featureHover: 'hover:border-gray-200 hover:bg-gray-50',
      featuresHeading: 'What we do',
      featuresSubtext: 'End-to-end creative and digital services.',
      footerBg: 'bg-black',
    },
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Independent professional building a personal brand',
    defaultTone: 'casual',
    promptInstructions: `You are writing copy for a freelancer's personal landing page.
- Headline should be personal and speak directly to the client's pain point
- Subheadline should quickly state who you are, what you do, and your specialty
- Features should be reframed as what the client gets (e.g. fast turnaround, clear communication, expert craft)
- FAQ should address availability, how to work together, revision policy, and payment
- CTA should invite prospects to book a call, view portfolio, or send a message
- Social proof should reference past clients, projects completed, or years of experience
- Write in first person ("I") with a warm, approachable, and confident voice`,
    previewTheme: {
      heroGradient: 'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600',
      heroSubtext: 'text-amber-100',
      ctaButton: 'bg-white text-amber-700 hover:bg-amber-50',
      ctaButtonText: 'text-amber-700',
      featureIconBg: 'bg-amber-100',
      featureHover: 'hover:border-amber-100 hover:bg-amber-50/40',
      featuresHeading: 'What you get when we work together',
      featuresSubtext: 'Thoughtful work, clear communication, great results.',
      footerBg: 'bg-gray-900',
    },
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    description: 'Online store or physical product with a strong buying proposition',
    defaultTone: 'casual',
    promptInstructions: `You are writing copy for an e-commerce product landing page.
- Headline should create desire and highlight the product's key benefit or transformation
- Subheadline should reinforce quality, uniqueness, or value proposition
- Features should focus on product benefits, materials, use cases, and what makes it special
- FAQ should address shipping, returns, sizing/compatibility, and warranty
- CTA should use urgent, action-oriented language (e.g. "Shop Now", "Get Yours Today", "Order Now")
- Social proof should reference customer reviews, units sold, or ratings (e.g. "4.9 stars from 2,000+ reviews")
- Use enthusiastic, benefit-driven, and persuasive language that drives purchase decisions`,
    previewTheme: {
      heroGradient: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800',
      heroSubtext: 'text-emerald-100',
      ctaButton: 'bg-white text-emerald-700 hover:bg-emerald-50',
      ctaButtonText: 'text-emerald-700',
      featureIconBg: 'bg-emerald-100',
      featureHover: 'hover:border-emerald-100 hover:bg-emerald-50/40',
      featuresHeading: 'Why customers love it',
      featuresSubtext: 'Everything you need, nothing you don\'t.',
      footerBg: 'bg-gray-900',
    },
  },
  {
    id: 'local-business',
    label: 'Local Business',
    description: 'Brick-and-mortar or community-based service business',
    defaultTone: 'casual',
    promptInstructions: `You are writing copy for a local business landing page.
- Headline should feel warm, trustworthy, and community-focused
- Subheadline should quickly explain what the business does and where it's located
- Features should highlight services offered, what makes the business special, and community ties
- FAQ should address hours, location, booking/reservations, and parking or accessibility
- CTA should drive local action (e.g. "Book a Table", "Call Us", "Visit Us Today", "Get a Quote")
- Social proof should reference years in business, local awards, or loyal customer base (e.g. "Serving the community since 2005")
- Use warm, friendly, and approachable language that builds local trust`,
    previewTheme: {
      heroGradient: 'bg-gradient-to-br from-rose-700 via-red-700 to-orange-700',
      heroSubtext: 'text-rose-100',
      ctaButton: 'bg-white text-rose-700 hover:bg-rose-50',
      ctaButtonText: 'text-rose-700',
      featureIconBg: 'bg-rose-100',
      featureHover: 'hover:border-rose-100 hover:bg-rose-50/40',
      featuresHeading: 'Why the community loves us',
      featuresSubtext: 'Rooted in the neighborhood, dedicated to you.',
      footerBg: 'bg-gray-900',
    },
  },
]

export const DEFAULT_TEMPLATE_ID: TemplateId = 'saas'

export function getTemplate(id: TemplateId | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
