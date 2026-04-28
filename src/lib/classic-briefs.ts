/**
 * Classic advertising brief principles and benchmark library.
 *
 * Seven strategic frameworks distilled from decades of creative effectiveness
 * research and campaign post-mortem analysis.
 */

// ---------------------------------------------------------------------------
// 1. STRATEGIC FRAMEWORKS: distilled principles for prompt injection
// ---------------------------------------------------------------------------

export interface MasterPrinciple {
  master: string
  era: string
  principle: string
  briefTest: string
}

export const MASTER_PRINCIPLES: MasterPrinciple[] = [
  {
    master: 'Research-Led Proposition',
    era: 'Core framework',
    principle: 'Every brief must contain one big idea rooted in consumer research. If the ad doesn\'t sell, it isn\'t creative. The brief should make one promise and prove it.',
    briefTest: 'Does this brief contain a single, provable consumer promise?',
  },
  {
    master: 'Human Truth',
    era: 'Core framework',
    principle: 'Find the simple human truth that makes the product relevant to real life. Execution IS the idea. The brief must leave room for surprise. Rules are what the artist breaks.',
    briefTest: 'Is there a human truth here that could move someone emotionally?',
  },
  {
    master: 'Creative Tension',
    era: 'Core framework',
    principle: 'Turn intelligence into magic. The brief must identify a genuine tension: between how things are and how they could be. Don\'t tell creatives what to make; tell them what to believe.',
    briefTest: 'Does this brief name a specific tension the creative can exploit?',
  },
  {
    master: 'Impact First',
    era: 'Core framework',
    principle: 'Impact first, then communication, then persuasion. Most advertising fails because it never gets noticed. The brief must define what makes this impossible to ignore before worrying about what it says.',
    briefTest: 'Does this brief address how the work will break through indifference?',
  },
  {
    master: 'Cultural Ambition',
    era: 'Core framework',
    principle: 'The best campaigns don\'t just advertise. They change culture. A brief should aim to redefine the brand\'s entire relationship with its audience, not just run an ad.',
    briefTest: 'Is this brief ambitious enough to change something in culture, or is it just filling a media plan?',
  },
  {
    master: 'USP Clarity',
    era: 'Core framework',
    principle: 'Every ad must make a Unique Selling Proposition. One claim. One benefit. Repeated relentlessly. The brief must identify what the product does that nothing else does.',
    briefTest: 'Can you state the USP in one sentence that a competitor cannot also claim?',
  },
  {
    master: 'Audience Empathy',
    era: 'Core framework',
    principle: 'The planner\'s job is to be the voice of the consumer in the room. The brief must demonstrate that someone has genuinely listened to the audience, not just profiled them.',
    briefTest: 'Does this brief show evidence of actually understanding how the audience thinks and feels?',
  },
]

export function getClassicPrinciplesPrompt(): string {
  const lines = MASTER_PRINCIPLES.map(p =>
    `• ${p.master}: "${p.principle}" | Test: ${p.briefTest}`
  )
  return `STRATEGIC BRIEF STANDARDS (judge the brief against these 7 frameworks):
${lines.join('\n')}`
}

// ---------------------------------------------------------------------------
// 2. CLASSIC BRIEF BENCHMARKS: iconic campaigns for comparison
// ---------------------------------------------------------------------------

export interface ClassicBrief {
  id: string
  campaign: string
  brand: string
  year: string
  agency: string
  singleMindedProposition: string
  humanTruth: string
  whyItWorked: string
  briefStrength: string
  industry: string
}

export const CLASSIC_BRIEFS: ClassicBrief[] = [
  {
    id: 'vw-lemon',
    campaign: 'Lemon',
    brand: 'Volkswagen',
    year: '1960',
    agency: 'DDB (Doyle Dane Bernbach)',
    singleMindedProposition: 'We reject any car that isn\'t perfect. You get the ones we don\'t.',
    humanTruth: 'People distrust car advertising because it all sounds the same, too perfect, too polished.',
    whyItWorked: 'By admitting a flaw ("Lemon", a rejected car), VW proved its quality standards. Honesty as a creative weapon.',
    briefStrength: 'Single proposition, radical honesty, audience insight about distrust of car ads.',
    industry: 'Automotive',
  },
  {
    id: 'avis-try-harder',
    campaign: 'We Try Harder',
    brand: 'Avis',
    year: '1962',
    agency: 'DDB',
    singleMindedProposition: 'When you\'re #2, you try harder. Or else.',
    humanTruth: 'People root for the underdog and distrust complacent market leaders.',
    whyItWorked: 'Turned a competitive weakness into the brand\'s defining virtue. Every employee became the proof point.',
    briefStrength: 'Clear competitive positioning, emotional underdog angle, simple enough for every touchpoint.',
    industry: 'Travel',
  },
  {
    id: 'nike-just-do-it',
    campaign: 'Just Do It',
    brand: 'Nike',
    year: '1988',
    agency: 'Wieden+Kennedy',
    singleMindedProposition: 'If you have a body, you are an athlete.',
    humanTruth: 'Everyone has an inner voice that talks them out of doing hard things.',
    whyItWorked: 'Made Nike about human determination, not shoes. Transcended product to own a mindset.',
    briefStrength: 'Universal human tension, infinitely scalable across media and audiences, culturally elastic.',
    industry: 'Retail',
  },
  {
    id: 'dove-real-beauty',
    campaign: 'Campaign for Real Beauty',
    brand: 'Dove',
    year: '2004',
    agency: 'Ogilvy',
    singleMindedProposition: 'Real beauty comes in all shapes and sizes.',
    humanTruth: 'Women feel worse about themselves after consuming beauty advertising, not better.',
    whyItWorked: 'Attacked the beauty industry\'s own conventions. Made the brand the antithesis of the category it sells in.',
    briefStrength: 'Research-backed insight, cultural provocation, category disruption through moral positioning.',
    industry: 'FMCG',
  },
  {
    id: 'apple-think-different',
    campaign: 'Think Different',
    brand: 'Apple',
    year: '1997',
    agency: 'TBWA\\Chiat\\Day',
    singleMindedProposition: 'The people who are crazy enough to think they can change the world are the ones who do.',
    humanTruth: 'Creative people feel misunderstood by mainstream culture. They want permission to be different.',
    whyItWorked: 'Repositioned Apple from a struggling computer company to the brand for creative rebels. Zero product features.',
    briefStrength: 'Brand repositioning through cultural affiliation, emotional rather than rational, tribe-building.',
    industry: 'Tech',
  },
  {
    id: 'snickers-hungry',
    campaign: 'You\'re Not You When You\'re Hungry',
    brand: 'Snickers',
    year: '2010',
    agency: 'BBDO',
    singleMindedProposition: 'Snickers fixes the version of you that hunger creates.',
    humanTruth: 'Everyone recognises that hunger makes them act out of character: cranky, irrational, un-themselves.',
    whyItWorked: 'Made the product the solution to a universally recognised human experience. Infinitely executable across cultures.',
    briefStrength: 'Universal human truth, clear product role, global scalability, humour as mechanic.',
    industry: 'FMCG',
  },
  {
    id: 'john-lewis-christmas',
    campaign: 'The Long Wait (and subsequent Christmas campaigns)',
    brand: 'John Lewis',
    year: '2011',
    agency: 'Adam&Eve/DDB',
    singleMindedProposition: 'For gifts you can\'t wait to give.',
    humanTruth: 'The joy of Christmas isn\'t receiving. It\'s the anticipation of giving to someone you love.',
    whyItWorked: 'Made an entire retail brand synonymous with an emotion. Created a cultural event out of advertising.',
    briefStrength: 'Emotional territory ownership, consistent execution over years, narrative ambition.',
    industry: 'Retail',
  },
  {
    id: 'guinness-surfer',
    campaign: 'Surfer',
    brand: 'Guinness',
    year: '1999',
    agency: 'AMV BBDO',
    singleMindedProposition: 'Good things come to those who wait.',
    humanTruth: 'In a world of instant gratification, the anticipation of something worth waiting for is a rare and powerful feeling.',
    whyItWorked: 'Turned the product\'s weakness (slow pour) into a virtue. Epic craft matched the brand\'s gravitas.',
    briefStrength: 'Product truth linked to human truth, cinematic ambition baked into the brief, tone and proposition unified.',
    industry: 'FMCG',
  },
]

// ---------------------------------------------------------------------------
// 3. CLASSIC STANDARDS SCORING RUBRIC
// ---------------------------------------------------------------------------

export interface ClassicStandardScore {
  standard: string
  master: string
  score: number
  maxScore: number
  verdict: string
  advice: string
}

export function scoreAgainstClassics(
  extractedBrief: Record<string, unknown>,
  gaps: string[],
  briefText: string
): ClassicStandardScore[] {
  const scores: ClassicStandardScore[] = []
  const lower = briefText.toLowerCase()
  const gapLower = gaps.map(g => g.toLowerCase()).join(' ')

  // 1. Single provable promise
  const hasObjective = !gapLower.includes('objective') && !gapLower.includes('goal')
  const objectiveWords = String(extractedBrief.objectives ?? extractedBrief.objective ?? '').split(/\s+/).length
  const singleProposition = hasObjective && objectiveWords > 5 && objectiveWords < 80
  scores.push({
    standard: 'Single Provable Promise',
    master: 'Research-Led Proposition',
    score: singleProposition ? 4 : hasObjective ? 2 : 0,
    maxScore: 5,
    verdict: singleProposition ? 'Brief has a focused proposition' : hasObjective ? 'Objectives exist but may lack focus' : 'No clear proposition found',
    advice: singleProposition
      ? 'Good. Now check: could a competitor make the same claim? If yes, it\'s not unique enough.'
      : 'State the one promise this campaign makes. "We want to [verb] among [audience] because [proof]."',
  })

  // 2. Human truth
  const truthKeywords = ['truth', 'insight', 'tension', 'feel', 'believe', 'fear', 'aspir', 'struggle', 'guilt', 'pride', 'belonging']
  const hasTruth = truthKeywords.some(kw => lower.includes(kw))
  const hasTension = !!(extractedBrief.tension ?? extractedBrief.insight ?? extractedBrief.human_truth)
  scores.push({
    standard: 'Human Truth',
    master: 'Human Truth',
    score: hasTension ? 5 : hasTruth ? 3 : 1,
    maxScore: 5,
    verdict: hasTension ? 'An explicit human truth or tension is stated' : hasTruth ? 'Emotional language present but no named truth' : 'Brief is functional, no emotional ground',
    advice: hasTension
      ? 'Now push it: is this truth specific enough to generate one idea, not fifty?'
      : 'Name the one thing people feel about this category that nobody is addressing. That\'s your truth.',
  })

  // 3. Creative tension
  const tensionWords = ['tension', 'conflict', 'paradox', 'contradiction', 'versus', ' vs ', 'but ', 'however', 'yet ']
  const hasTensionLanguage = tensionWords.some(tw => lower.includes(tw))
  scores.push({
    standard: 'Creative Tension',
    master: 'Creative Tension',
    score: hasTensionLanguage ? 4 : 1,
    maxScore: 5,
    verdict: hasTensionLanguage ? 'The brief contains tension language creatives can exploit' : 'No clear tension. Brief reads as a statement, not a provocation.',
    advice: hasTensionLanguage
      ? 'Good tension spotted. Make sure it\'s between two real forces, not just a marketing observation.'
      : 'Where\'s the "but"? The gap between how things are and how they could be is where great ideas live.',
  })

  // 4. Standout / impact thinking
  const impactWords = ['attention', 'standout', 'disrupt', 'break through', 'cut through', 'notice', 'impossible to ignore', 'fame', 'pr hook', 'earned']
  const hasImpactThinking = impactWords.some(iw => lower.includes(iw))
  scores.push({
    standard: 'Impact First',
    master: 'Impact First',
    score: hasImpactThinking ? 4 : 1,
    maxScore: 5,
    verdict: hasImpactThinking ? 'Brief considers how the work will get noticed' : 'Brief assumes the work will be seen. Dangerous in a cluttered world.',
    advice: hasImpactThinking
      ? 'Good. Now ask: would this stop a real person scrolling? Not just impress an awards jury.'
      : 'Add one line about how this work breaks through indifference. If nobody sees it, nothing else matters.',
  })

  // 5. Cultural ambition
  const cultureWords = ['cultur', 'movement', 'redefine', 'change', 'transform', 'shift', 'conversation', 'zeitgeist', 'social', 'community']
  const hasCulturalAmbition = cultureWords.some(cw => lower.includes(cw))
  scores.push({
    standard: 'Cultural Ambition',
    master: 'Cultural Ambition',
    score: hasCulturalAmbition ? 4 : 1,
    maxScore: 5,
    verdict: hasCulturalAmbition ? 'Brief aims to create cultural impact, not just advertising' : 'Brief is advertising-shaped. It won\'t create conversation.',
    advice: hasCulturalAmbition
      ? 'Ambition is there. Make sure the execution plan matches it. Culture doesn\'t come from a media plan alone.'
      : 'What would make people talk about this without being asked? That\'s the brief\'s missing layer.',
  })

  // 6. USP clarity
  const hasUSP = !!(extractedBrief.key_message ?? extractedBrief.usp ?? extractedBrief.proposition)
  const toneExists = !gapLower.includes('tone')
  scores.push({
    standard: 'USP Clarity',
    master: 'USP Clarity',
    score: hasUSP ? 5 : toneExists ? 2 : 0,
    maxScore: 5,
    verdict: hasUSP ? 'A clear unique selling proposition is stated' : 'No explicit USP. The brief could apply to any competitor.',
    advice: hasUSP
      ? 'Now test it: swap in your competitor\'s name. If it still works, it\'s not unique.'
      : 'Complete: "Only [brand] can [claim] because [reason]." That\'s your USP.',
  })

  // 7. Audience empathy
  const audienceDetail = String(extractedBrief.target_audience ?? extractedBrief.audience ?? '')
  const hasMindsetsOrBehaviours = /mindset|behavio|attitude|feel|think|worry|struggle|aspir|lifestyle/i.test(audienceDetail)
  const hasDemographicsOnly = /\d{2}[-–]\d{2}|male|female|abc1|income/i.test(audienceDetail) && !hasMindsetsOrBehaviours
  scores.push({
    standard: 'Audience Empathy',
    master: 'Audience Empathy',
    score: hasMindsetsOrBehaviours ? 5 : hasDemographicsOnly ? 2 : audienceDetail.length > 10 ? 1 : 0,
    maxScore: 5,
    verdict: hasMindsetsOrBehaviours
      ? 'Audience defined by mindset and behaviour, not just demographics'
      : hasDemographicsOnly
        ? 'Audience defined by demographics alone. Creatives can\'t write to a spreadsheet.'
        : 'Audience is underspecified',
    advice: hasMindsetsOrBehaviours
      ? 'Strong. Could you add one verbatim quote from a real person in this audience?'
      : 'Describe the audience as a person, not a segment. What do they worry about at 2am? That\'s where the brief lives.',
  })

  return scores
}

// ---------------------------------------------------------------------------
// 4. MATCH CLASSIC BRIEF REFERENCES
// ---------------------------------------------------------------------------

export function findRelevantClassics(
  industry: string | undefined,
  extractedBrief: Record<string, unknown>,
  briefText: string
): ClassicBrief[] {
  const matches: Array<{ brief: ClassicBrief; relevance: number }> = []

  for (const classic of CLASSIC_BRIEFS) {
    let relevance = 0

    if (industry && classic.industry.toLowerCase() === industry.toLowerCase()) {
      relevance += 3
    }

    const briefLower = briefText.toLowerCase()
    const keywords = [
      classic.humanTruth.toLowerCase(),
      classic.singleMindedProposition.toLowerCase(),
    ].join(' ')

    const sharedTerms = ['truth', 'tension', 'honesty', 'emotion', 'underdog', 'beauty', 'wait', 'rebel', 'hungry', 'gift']
    for (const term of sharedTerms) {
      if (briefLower.includes(term) && keywords.includes(term)) {
        relevance += 2
      }
    }

    if (relevance > 0 || matches.length < 2) {
      matches.push({ brief: classic, relevance: Math.max(relevance, 1) })
    }
  }

  return matches
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3)
    .map(m => m.brief)
}
