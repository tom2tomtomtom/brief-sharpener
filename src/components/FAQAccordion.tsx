'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'What is Brief Intelligence?',
    answer:
      'Brief Intelligence is AIDEN\'s core capability: a deep interrogation of your creative or campaign brief that finds every gap, assumption, and weakness before your team acts on it. It identifies missing audience insight, vague objectives, absent tension, weak deliverables, and fuzzy tone of voice — then rewrites the brief to fix them.',
  },
  {
    question: 'How is this different from ChatGPT?',
    answer:
      'ChatGPT will help you if you know what to ask. AIDEN knows what to ask on your behalf — because it\'s been trained on the way the best strategists, planners, and creative directors interrogate briefs. It doesn\'t wait for you to find the gaps. It finds them for you, explains why they matter, and rewrites the brief with the gaps closed.',
  },
  {
    question: 'What are phantoms?',
    answer:
      'Phantoms are the expert strategic perspectives AIDEN uses to interrogate your brief. They represent distinct strategic and creative viewpoints — the account planner who questions every audience assumption, the creative director who demands a single-minded proposition, the strategist who won\'t accept a vague objective. Each phantom stresses a different part of your brief, so nothing gets missed.',
  },
  {
    question: 'Who is this for?',
    answer:
      'Brief Intelligence is built for anyone who briefs creative work: agency strategists and planners, brand managers, in-house creative directors, freelance consultants, and founders who need to brief external agencies. If a weak brief has ever cost you time, money, or mediocre work, AIDEN is for you.',
  },
  {
    question: 'What does the output look like?',
    answer:
      'You get two things: a gap report that identifies every weakness in your brief and explains why it matters, and a rewritten brief with those gaps closed. On the Free plan, the output includes AIDEN branding. On Pro, you get a clean PDF — ready to share with your team or client.',
  },
  {
    question: 'Can I use this for any type of brief?',
    answer:
      'Yes. AIDEN works with campaign briefs, creative briefs, strategy documents, and rough notes. It\'s format-agnostic — paste in whatever you have and AIDEN will interrogate it. The more context you give, the sharper the output.',
  },
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-black-deep px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight text-white text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={item.question}
                className="rounded-xl border border-border-subtle bg-black-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white">{item.question}</span>
                  <span
                    className={`ml-4 flex-shrink-0 text-white-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-white-muted leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
