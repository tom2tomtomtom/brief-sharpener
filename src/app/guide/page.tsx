import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Write a Better Creative Brief: The Complete Guide',
  description:
    'Learn the 8 essential elements every creative brief needs, the most common brief mistakes, and how to write briefs that get great creative work every time.',
  openGraph: {
    title: 'How to Write a Better Creative Brief: The Complete Guide',
    description:
      'Learn the 8 essential elements every creative brief needs, the most common brief mistakes, and how to write briefs that get great creative work every time.',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Write a Better Creative Brief: The Complete Guide',
    description:
      'Learn the 8 essential elements every creative brief needs, the most common brief mistakes, and how to write briefs that get great creative work every time.',
  },
}

function InlineCTA() {
  return (
    <div className="my-10 rounded-xl border border-border-subtle bg-black-card px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white uppercase tracking-wide">Not sure if your brief is ready?</p>
        <p className="text-sm text-white-muted mt-0.5">
          AIDEN checks your brief against 8 essential creative criteria in seconds.
        </p>
      </div>
      <Link
        href="/generate"
        className="shrink-0 rounded-lg bg-red-hot px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Check your brief with AIDEN →
      </Link>
    </div>
  )
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-black-ink">
      {/* Nav */}
      <nav className="border-b border-border-subtle bg-black-ink/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold tracking-tight text-white uppercase">
            AIDEN
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-white-muted hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white-muted hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/generate"
              className="rounded-lg bg-red-hot px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-b border-border-subtle">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-orange-accent uppercase tracking-wide mb-3">
            The Complete Guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white uppercase leading-tight mb-6">
            How to Write a Better Creative Brief
          </h1>
          <p className="text-xl text-white-muted leading-relaxed">
            A vague brief produces vague creative. The best briefs are not documents. They are
            decisions. This guide covers everything you need to write briefs that actually inspire
            great work.
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-white-dim">
            <span>15 min read</span>
            <span>·</span>
            <span>Updated March 2026</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-16">

          {/* Section 1 */}
          <section>
            <h2 className="text-3xl font-bold text-white uppercase mb-6">
              1. What Makes a Great Brief
            </h2>
            <div className="space-y-4 text-white-muted leading-relaxed">
              <p>
                A great brief is not a long one. It is a sharp one. The purpose of a creative brief
                is not to document everything you know. It is to isolate the single most important
                thing a piece of work needs to do, and give the creative team everything they need
                to do it well.
              </p>
              <p>
                Great briefs share three qualities: <strong className="text-white">clarity</strong>{' '}
                (everyone reading it arrives at the same understanding),{' '}
                <strong className="text-white">constraint</strong> (it closes off wrong directions
                so creative energy flows in the right ones), and{' '}
                <strong className="text-white">tension</strong> (it presents a problem worth
                solving, not just a task to execute).
              </p>
              <p>
                Think of the brief as a contract between strategy and creativity. Strategy commits
                to defining the problem clearly. Creativity commits to solving it. When the contract
                is fuzzy, both sides lose.
              </p>
              <h3 className="text-xl font-semibold text-white uppercase mt-8 mb-3">
                The brief vs. the briefing
              </h3>
              <p>
                The brief is a document. The briefing is a conversation. Both matter. Many teams
                write a strong brief but skip the briefing: the live session where creative
                teams can ask questions, push back, and internalise the challenge. Always do both.
              </p>
              <h3 className="text-xl font-semibold text-white uppercase mt-8 mb-3">
                Who writes the brief?
              </h3>
              <p>
                The brief is typically written by a strategist or account lead, in collaboration
                with the client. The client often has strong opinions about what they want to say;
                the strategist&apos;s job is to translate that into what the audience needs to hear.
                These are often very different things.
              </p>
            </div>

            <InlineCTA />
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-3xl font-bold text-white uppercase mb-6">
              2. The 8 Essential Elements Every Brief Needs
            </h2>
            <p className="text-white-muted leading-relaxed mb-8">
              Strip back any great brief and you will find these eight elements. Some briefs call
              them different things, but the underlying information is always the same. Miss any one
              of them and you create ambiguity that costs time, money, and goodwill.
            </p>

            {/* Element 1 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">1. Objective</h3>
              <p className="text-white-muted leading-relaxed">
                What does this work need to achieve? Be specific about the business outcome, not just
                the deliverable. &ldquo;We want a TV spot&rdquo; is a deliverable. &ldquo;We want to shift 18–34
                brand consideration by 8 points over the next quarter&rdquo; is an objective.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: A brief can have only one primary objective. If you have three, you actually
                have three briefs.
              </p>
            </div>

            {/* Element 2 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">2. Audience</h3>
              <p className="text-white-muted leading-relaxed">
                Who is this for? Go beyond demographics. The most useful audience descriptions
                capture mindset, motivation, and tension. &ldquo;Women 25–45&rdquo; tells a creative nothing.
                &ldquo;New mothers who feel judged for going back to work but also guilt-ridden for
                wanting to&rdquo; gives them something to work with.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: Describe the audience at the moment they will encounter the work. What are
                they thinking, feeling, or doing right then?
              </p>
            </div>

            {/* Element 3 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">3. Deliverables</h3>
              <p className="text-white-muted leading-relaxed">
                What are you actually making? List every asset with its specs: format, dimensions,
                duration, language versions, quantities. Vague deliverables lead to scope creep and
                missed expectations on both sides.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: Separate &ldquo;must have&rdquo; from &ldquo;nice to have&rdquo; deliverables so the team
                knows where to focus if time runs short.
              </p>
            </div>

            {/* Element 4 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">4. Tone</h3>
              <p className="text-white-muted leading-relaxed">
                How should this work feel? Tone is not just about language. It encompasses visual
                register, emotional temperature, and brand personality. Define it by choosing three
                adjectives, then sharpen each one: not just &ldquo;warm&rdquo; but &ldquo;the warmth of a trusted
                older sibling, not a greeting card.&rdquo;
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: &ldquo;Tone reference&rdquo; examples (brands, films, publications you admire) communicate
                faster than any adjective list.
              </p>
            </div>

            {/* Element 5 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">5. Budget</h3>
              <p className="text-white-muted leading-relaxed">
                What is the production budget? Creatives need to know what world they are playing in.
                A great idea that costs five times the budget is not a great idea for this brief.
                It is a waste of everyone&apos;s time. Sharing the budget does not weaken your negotiating
                position; it gives the team the constraint they need to be resourceful.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: If budget is genuinely confidential, provide a range or a proxy: &ldquo;this should
                feel like a £200k shoot, not a £20k one.&rdquo;
              </p>
            </div>

            {/* Element 6 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">6. Timeline</h3>
              <p className="text-white-muted leading-relaxed">
                When does the work go live, and what are the key milestones between now and then?
                Include: brief sign-off date, concept presentation, client feedback rounds, legal
                approval, production start, and final delivery. A timeline without these waypoints
                is just a deadline.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: Work backwards from the live date. If the timeline is impossible, say so now,
                not three weeks in.
              </p>
            </div>

            {/* Element 7 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">7. KPIs</h3>
              <p className="text-white-muted leading-relaxed">
                How will you know if the work succeeded? Define the metrics upfront. These might be
                brand tracking scores, click-through rates, share of voice, sales uplift, or
                qualitative research. Whatever they are, agree them before the work starts, not
                after, when everyone is post-rationalising.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: KPIs reveal what the client really cares about. If they cannot name their KPIs,
                the brief is not ready.
              </p>
            </div>

            {/* Element 8 */}
            <div className="border-l-4 border-red-hot pl-6 mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-2">8. Brand Context</h3>
              <p className="text-white-muted leading-relaxed">
                What does the creative team need to know about the brand to do this job? This
                includes: brand positioning, visual identity guidelines, tone of voice principles,
                key mandatories (logo usage, legal disclaimers), and critically, what the brand
                has done before so the team can build on or deliberately depart from it.
              </p>
              <p className="text-white-dim text-sm mt-3 italic">
                Tip: Include &ldquo;mandatories&rdquo; (things that must appear) and &ldquo;no-go zones&rdquo; (things that
                are off-limits). Both save time.
              </p>
            </div>

            <InlineCTA />
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-3xl font-bold text-white uppercase mb-6">
              3. Common Brief Mistakes (and How to Fix Them)
            </h2>
            <p className="text-white-muted leading-relaxed mb-8">
              Most brief problems are predictable. Here are the most common mistakes, and what
              good looks like instead.
            </p>

            {/* Mistake 1 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-4">
                Mistake 1: The kitchen-sink brief
              </h3>
              <p className="text-white-muted mb-5">
                Trying to say everything at once. The brief becomes a strategy document, a
                project plan, and a brand bible all in one. Creatives cannot find the signal in
                the noise.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-red-hot uppercase tracking-wide mb-2">Bad</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;We want to drive brand awareness, increase consideration, grow social
                    following, support our retail partners, and also communicate our new product
                    range launch while staying true to our 10-year heritage.&rdquo;
                  </p>
                </div>
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-orange-accent uppercase tracking-wide mb-2">Good</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Make 25–35 year olds in London consider us for their first home insurance.
                    That&apos;s the job. Everything else is secondary.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Mistake 2 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-4">
                Mistake 2: Describing the execution, not the problem
              </h3>
              <p className="text-white-muted mb-5">
                Telling creatives what to make instead of what to solve. This removes creative
                thinking from the process entirely, and usually produces mediocre work.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-red-hot uppercase tracking-wide mb-2">Bad</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;We want a 30-second TV ad showing a family enjoying our product at home,
                    with upbeat background music and a clear product shot at the end.&rdquo;
                  </p>
                </div>
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-orange-accent uppercase tracking-wide mb-2">Good</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Families underestimate how much this product would change their evenings.
                    Solve that. Medium is flexible (TV, digital, experiential), whatever gets
                    there best.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Mistake 3 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-4">
                Mistake 3: Audience by demographics only
              </h3>
              <p className="text-white-muted mb-5">
                Defining the audience by age and gender tells the creative team almost nothing
                about how to connect with them.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-red-hot uppercase tracking-wide mb-2">Bad</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Target audience: Men and women aged 30–50, ABC1, homeowners.&rdquo;
                  </p>
                </div>
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-orange-accent uppercase tracking-wide mb-2">Good</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;People who care deeply about their home but feel guilty spending money on
                    it for themselves. They&apos;d justify it easily as a gift, but not for themselves.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Mistake 4 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-4">
                Mistake 4: No single-minded proposition
              </h3>
              <p className="text-white-muted mb-5">
                The proposition (the one thing you want someone to think, feel, or believe after
                seeing the work) is missing or buried in a list of messages. Without it, creative
                teams cannot make decisions.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-red-hot uppercase tracking-wide mb-2">Bad</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Key messages: quality, value, heritage, innovation, sustainability, and
                    great customer service.&rdquo;
                  </p>
                </div>
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-orange-accent uppercase tracking-wide mb-2">Good</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Proposition: The only energy drink that doesn&apos;t make you feel like you
                    sold out.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Mistake 5 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white uppercase mb-4">
                Mistake 5: Mandatories buried or missing
              </h3>
              <p className="text-white-muted mb-5">
                Logo placement rules, legal disclaimers, product shots, and brand lockups that
                must appear are often omitted from the brief, then surface at review, causing
                expensive revisions.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-red-hot uppercase tracking-wide mb-2">Bad</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Please follow brand guidelines.&rdquo; (No guidelines attached. No detail provided.)
                  </p>
                </div>
                <div className="rounded-lg bg-black-card border border-border-subtle p-4">
                  <p className="text-xs font-bold text-orange-accent uppercase tracking-wide mb-2">Good</p>
                  <p className="text-sm text-white-muted leading-relaxed">
                    &ldquo;Mandatories: brand logo bottom-right, legal line below it, product must
                    appear in last 5 seconds, no competitor references, no health claims without
                    legal sign-off. Brand guide attached.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <InlineCTA />
          </section>

          {/* Final CTA */}
          <section className="rounded-2xl bg-black-card border border-border-subtle text-white px-8 py-12 text-center">
            <h2 className="text-3xl font-bold uppercase mb-4">Ready to sharpen your brief?</h2>
            <p className="text-white-muted text-lg mb-8 max-w-xl mx-auto">
              AIDEN analyses your brief against 8 essential creative criteria (gaps in strategy,
              missing audience insight, weak propositions, and more) and sends back a smarter
              version in seconds.
            </p>
            <Link
              href="/generate"
              className="inline-block rounded-lg bg-red-hot px-8 py-4 text-base font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Check your brief with AIDEN, it&apos;s free
            </Link>
            <p className="text-white-dim text-sm mt-4">No account needed to start.</p>
          </section>

        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white-dim">
          <Link href="/" className="font-semibold text-white uppercase">
            AIDEN
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
          <span>Built with Claude AI by Anthropic</span>
        </div>
      </footer>
    </main>
  )
}
