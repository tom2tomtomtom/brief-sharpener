const examples = [
  {
    id: 1,
    label: 'Fashion retail campaign',
    briefExcerpt:
      'Launch our new summer collection to fashion-forward young women. Drive awareness and sales. Use social media and influencers. Tone should be aspirational and trendy.',
    score: 42,
    scoreLabel: 'Weak brief',
    scoreColor: 'bg-red-100 text-red-700',
    scoreBorderColor: 'border-red-200',
    scoreRingColor: 'ring-red-200',
    gaps: [
      {
        icon: '👤',
        title: 'Missing audience psychology',
        detail: '"Fashion-forward young women" tells creatives nothing. AIDEN identified no insight into what drives purchase decisions for this cohort or what tension the brand should exploit.',
      },
      {
        icon: '🎯',
        title: 'No measurable objective',
        detail: '"Drive awareness and sales" is two objectives with no success bar. AIDEN found no KPI, no timeframe, and no definition of what good looks like.',
      },
      {
        icon: '🔗',
        title: 'No single-minded proposition',
        detail: 'The brief attempts to cover aspiration, trendiness, and newness simultaneously. AIDEN could not identify a single ownable idea for creative to build around.',
      },
    ],
  },
  {
    id: 2,
    label: 'B2B SaaS product launch',
    briefExcerpt:
      'We\'re launching a new project management tool for mid-market teams. Audience is operations managers at companies with 50–200 employees. Goal is to generate 500 trial sign-ups in Q3. Key message: simpler than competitors, integrates with everything.',
    score: 67,
    scoreLabel: 'Needs sharpening',
    scoreColor: 'bg-amber-100 text-amber-700',
    scoreBorderColor: 'border-amber-200',
    scoreRingColor: 'ring-amber-200',
    gaps: [
      {
        icon: '⚡',
        title: 'No category tension identified',
        detail: '"Simpler than competitors" is a feature claim, not a tension. AIDEN found no articulation of why operations managers are frustrated today or what emotional state the brand should meet them in.',
      },
      {
        icon: '💬',
        title: 'Tone of voice undefined',
        detail: 'The brief contains no tone guidance. "Integrates with everything" could be written 10 different ways. AIDEN flagged this as a risk for inconsistent creative output across channels.',
      },
      {
        icon: '📋',
        title: 'Deliverables not specified',
        detail: 'The brief names a sign-up target but lists no channels, assets, or formats. AIDEN cannot validate whether the proposed activity is sufficient to hit 500 trials without knowing what\'s being made.',
      },
    ],
  },
]

function ScoreRing({ score }: { score: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score < 50 ? '#ef4444' : score < 70 ? '#f59e0b' : '#22c55e'

  return (
    <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xl font-bold text-gray-900">{score}</span>
    </div>
  )
}

export default function ExampleOutputs() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-4">
            Example outputs
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What AIDEN actually finds
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Real brief analyses. Real gaps. See exactly what AIDEN surfaces before your brief reaches a creative team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {examples.map((example) => (
            <div
              key={example.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Card header */}
              <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-4 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {example.label}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${example.scoreColor}`}>
                  {example.scoreLabel}
                </span>
              </div>

              <div className="px-6 pt-6 pb-5 flex flex-col gap-6">
                {/* Brief excerpt + score */}
                <div className="flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Brief excerpt</p>
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                      {example.briefExcerpt}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <ScoreRing score={example.score} />
                    <span className="text-xs text-gray-400 font-medium">/100</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Gaps */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Top 3 gaps found
                  </p>
                  <ul className="space-y-3">
                    {example.gaps.map((gap) => (
                      <li key={gap.title} className="flex items-start gap-3">
                        <span className="text-base leading-none mt-0.5 flex-shrink-0">{gap.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{gap.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{gap.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          AIDEN checks every brief for 8 essential elements that predict creative success.
        </p>
      </div>
    </section>
  )
}
