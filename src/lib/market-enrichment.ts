/**
 * Market intelligence enrichment for brief analysis.
 *
 * Curated industry data and heuristic-based insight generation.
 * In the future this can be backed by a search API (Perplexity, Tavily)
 * or a vector store. For now it uses a curated knowledge base that
 * provides useful context without external API dependencies.
 */

import { logger } from '@/lib/logger'

export interface MarketInsight {
  category: 'audience' | 'competitive' | 'channel' | 'benchmark' | 'trend'
  insight: string
  source: string
  relevance: 'high' | 'medium'
}

interface IndustryProfile {
  industry: string
  insights: MarketInsight[]
}

const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    industry: 'fmcg',
    insights: [
      { category: 'benchmark', insight: 'FMCG brands see average social media engagement rates of 0.3–0.8%. Top-performing launches exceed 1.5% through influencer seeding and UGC.', source: 'Industry average, Sprout Social 2025', relevance: 'high' },
      { category: 'audience', insight: 'Health-conscious consumers now cross all demographics. 67% of UK adults claim to have made dietary changes in the past year.', source: 'Mintel Consumer Trends 2025', relevance: 'medium' },
      { category: 'channel', insight: 'TikTok and Instagram Reels drive 3x higher trial intent for FMCG products compared to static social. Short-form video is the launch format.', source: 'Meta & TikTok business reports', relevance: 'high' },
      { category: 'competitive', insight: 'Over 200 new "better for you" snack brands launched in the UK in 2024 alone. Differentiation requires cultural positioning, not just health claims.', source: 'Euromonitor FMCG Report 2025', relevance: 'high' },
      { category: 'trend', insight: 'Consumers increasingly reject "clean label" marketing as performative. Authenticity and transparency in sourcing outperform health halo messaging.', source: 'Kantar Brand Footprint', relevance: 'medium' },
    ],
  },
  {
    industry: 'tech',
    insights: [
      { category: 'benchmark', insight: 'B2B SaaS brands achieve average conversion rates of 2.4% from demo request to close. Top performers reach 7%+ through intent-based targeting.', source: 'OpenView SaaS Benchmarks 2025', relevance: 'high' },
      { category: 'channel', insight: 'LinkedIn remains the #1 B2B demand gen channel, with sponsored content CTRs averaging 0.44%. Thought leadership content generates 3x higher engagement than product posts.', source: 'LinkedIn Marketing Solutions', relevance: 'high' },
      { category: 'audience', insight: 'The average B2B buying committee has 6–10 decision-makers. Campaigns must reach multiple personas, not just the primary decision-maker.', source: 'Gartner B2B Buying Report', relevance: 'medium' },
      { category: 'competitive', insight: 'AI-native positioning is now claimed by 78% of new SaaS products. The term is losing distinctiveness. Specificity about which AI capability matters is critical.', source: 'G2 Category Analysis', relevance: 'high' },
      { category: 'trend', insight: 'Product-led growth (PLG) adoption continues: 58% of B2B SaaS offers a free trial or freemium tier. Briefs should consider the trial-to-paid conversion flow.', source: 'ProductLed Institute', relevance: 'medium' },
    ],
  },
  {
    industry: 'finance',
    insights: [
      { category: 'benchmark', insight: 'Financial services display ads average 0.33% CTR, below the cross-industry 0.46%. Trust-building content outperforms product-led messaging by 2.1x.', source: 'WordStream Financial Benchmarks', relevance: 'high' },
      { category: 'audience', insight: '73% of consumers say they would switch banks for a better digital experience. UX is now a primary brand differentiator in financial services.', source: 'PwC Digital Banking Survey', relevance: 'high' },
      { category: 'channel', insight: 'Podcast sponsorships deliver 4.4x higher brand recall in financial services than display advertising, making them the emerging channel for trust-building.', source: 'Edison Research Podcast Trust', relevance: 'medium' },
      { category: 'trend', insight: 'Regulatory scrutiny of "finfluencer" content is increasing. Briefs must plan for compliance review in creative development timelines.', source: 'FCA Consumer Duty 2024', relevance: 'medium' },
    ],
  },
  {
    industry: 'retail',
    insights: [
      { category: 'benchmark', insight: 'UK retail Christmas campaigns see ROI of £1.70–£3.20 per £1 spent. Emotional campaigns outperform promotional ones by 2x on long-term brand metrics.', source: 'IPA Effectiveness Databank', relevance: 'high' },
      { category: 'audience', insight: 'Gift-buyers research an average of 3.2 sources before purchasing. Social proof (reviews, UGC) is the #1 conversion driver for considered gifts.', source: 'Google Consumer Insights', relevance: 'high' },
      { category: 'channel', insight: 'Pinterest drives 2.3x higher purchase intent for home and gifting categories compared to other social platforms. Often overlooked in media plans.', source: 'Pinterest Business Insights', relevance: 'medium' },
      { category: 'trend', insight: 'Sustainability credentials influence 62% of UK gift purchases but are cited as the primary purchase driver by only 8%. Lead with emotion, support with ethics.', source: 'Deloitte Retail Outlook 2025', relevance: 'medium' },
    ],
  },
  {
    industry: 'healthcare',
    insights: [
      { category: 'benchmark', insight: 'Health campaign awareness uplifts average 8–12% post-campaign. Campaigns using patient stories outperform statistical messaging by 3.5x on empathy metrics.', source: 'Kantar Health Insights', relevance: 'high' },
      { category: 'audience', insight: 'Patient audiences increasingly self-diagnose via online research before seeing HCPs. 77% of health journeys begin with a search engine.', source: 'Google Health Consumer Survey', relevance: 'high' },
      { category: 'channel', insight: 'Regulatory requirements add 4-8 weeks to creative approval timelines. Factor this into the brief timeline. Late compliance review kills campaigns.', source: 'Industry standard practice', relevance: 'medium' },
    ],
  },
  {
    industry: 'automotive',
    insights: [
      { category: 'benchmark', insight: 'Automotive consideration campaigns require 6–8 touchpoints before test drive. Average test-drive conversion from digital campaigns: 1.2%.', source: 'Kantar Automotive Insights', relevance: 'high' },
      { category: 'audience', insight: 'EV consideration has plateaued at 38% of intenders in key markets. The barrier is no longer awareness but range anxiety and charging infrastructure trust.', source: 'McKinsey Mobility Report 2025', relevance: 'high' },
      { category: 'channel', insight: 'Automotive video completion rates on YouTube average 25%. The first 5 seconds determine 80% of view-through. Lead with the hook, not the logo.', source: 'Google Auto Insights', relevance: 'medium' },
    ],
  },
  {
    industry: 'entertainment',
    insights: [
      { category: 'benchmark', insight: 'Tentpole entertainment launches see 40% of ticket/stream decisions made in the final 72 hours. Late-funnel urgency creative is critical.', source: 'Comscore Entertainment Reports', relevance: 'high' },
      { category: 'audience', insight: 'Gen Z entertainment consumption is 78% algorithmically surfaced. Organic discoverability (not just paid media) must be part of the launch strategy.', source: 'YouTube Culture & Trends', relevance: 'high' },
      { category: 'channel', insight: 'Cross-platform IP campaigns generate 2.8x higher engagement when the content is native to each platform rather than repurposed from one hero asset.', source: 'Meta Entertainment Insights', relevance: 'medium' },
    ],
  },
]

export function enrichWithMarketInsights(
  industry: string | undefined,
  extractedBrief: Record<string, unknown>,
  briefText: string
): MarketInsight[] {
  const insights: MarketInsight[] = []

  if (industry) {
    const profile = INDUSTRY_PROFILES.find(
      p => p.industry.toLowerCase() === industry.toLowerCase()
    )
    if (profile) {
      insights.push(...profile.insights)
    }
  }

  if (insights.length === 0) {
    const lower = briefText.toLowerCase()
    for (const profile of INDUSTRY_PROFILES) {
      if (lower.includes(profile.industry)) {
        insights.push(...profile.insights.filter(i => i.relevance === 'high'))
        break
      }
    }
  }

  const universalInsights: MarketInsight[] = [
    {
      category: 'benchmark',
      insight: 'IPA data shows campaigns that combine emotional brand-building with rational activation messaging are 2x more effective than either approach alone.',
      source: 'IPA Effectiveness Databank (Binet & Field)',
      relevance: 'high',
    },
    {
      category: 'benchmark',
      insight: 'The optimal budget split for established brands is roughly 60% brand-building / 40% activation. New brands may need to invert this ratio during launch.',
      source: 'Binet & Field, The Long and the Short of It',
      relevance: 'medium',
    },
  ]

  if (insights.length < 3) {
    insights.push(...universalInsights)
  }

  logger.info('market.enrichment', {
    industry: industry ?? 'unspecified',
    insightCount: insights.length,
  })

  return insights.slice(0, 6)
}

export function formatInsightsForPrompt(insights: MarketInsight[]): string {
  if (insights.length === 0) return ''

  const lines = insights.map(i =>
    `• [${i.category.toUpperCase()}] ${i.insight} (${i.source})`
  )

  return `\nMARKET INTELLIGENCE (use where relevant to strengthen your analysis):
${lines.join('\n')}`
}
