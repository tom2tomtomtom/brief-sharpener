import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/usage'

const BRIEF_FIELD_LABELS: Record<string, string> = {
  campaign_name: 'Campaign',
  objectives: 'Objectives',
  objective: 'Objective',
  target_audience: 'Target Audience',
  brand: 'Brand',
  brand_name: 'Brand',
  deliverables: 'Deliverables',
  requirements: 'Requirements',
  platforms: 'Platforms',
  tone: 'Tone of Voice',
  tone_of_voice: 'Tone of Voice',
  budget: 'Budget',
  timeline: 'Timeline',
  kpis: 'Success Metrics / KPIs',
  confidence: 'Confidence',
  key_message: 'Key Message',
  constraints: 'Constraints',
  aiden_analysis: 'AIDEN Analysis',
}

function fieldLabel(key: string): string {
  return BRIEF_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safeText(value: unknown): string {
  if (Array.isArray(value)) return escapeHtml(value.map(item => String(item)).join(', '))
  if (typeof value === 'object' && value !== null) return escapeHtml(JSON.stringify(value))
  return escapeHtml(String(value))
}

function fieldValue(value: unknown): string {
  return safeText(value)
}

function getScoreLabel(score: number): string {
  if (score >= 71) return 'Strong brief'
  if (score >= 40) return 'Needs work'
  return 'Incomplete brief'
}

function getScoreColor(score: number): string {
  if (score >= 71) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

function getGapSeverity(gap: string): 'critical' | 'warning' | 'info' {
  const lower = gap.toLowerCase()
  if (lower.includes('objective') || lower.includes('target audience') || lower.includes('deliverable')) return 'critical'
  if (lower.includes('budget') || lower.includes('timeline') || lower.includes('kpi') || lower.includes('metric')) return 'warning'
  return 'info'
}

const SEVERITY_LABEL = { critical: 'Critical', warning: 'Missing', info: 'Consider adding' }
const SEVERITY_COLOR = { critical: '#dc2626', warning: '#d97706', info: '#2563eb' }

function buildExtractedBriefHtml(extractedBrief: Record<string, unknown>): string {
  const fields = Object.entries(extractedBrief).filter(([, v]) => {
    if (v === null || v === undefined || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
  if (fields.length === 0) return ''

  const rows = fields.map(([key, value]) => `
    <div class="card">
      <p class="label">${escapeHtml(fieldLabel(key))}</p>
      <p class="value">${fieldValue(value)}</p>
    </div>
  `).join('')

  return `
    <section class="section">
      <h2 class="section-title">Extracted Brief</h2>
      <div class="grid">${rows}</div>
    </section>
  `
}

function buildGapAnalysisHtml(gaps: string[]): string {
  if (gaps.length === 0) {
    return `
      <section class="section">
        <h2 class="section-title">Gap Analysis</h2>
        <div class="no-gaps">No gaps found. Your brief covers all key areas.</div>
      </section>
    `
  }

  const items = gaps.map(gap => {
    const severity = getGapSeverity(gap)
    const color = SEVERITY_COLOR[severity]
    const label = SEVERITY_LABEL[severity]
    return `
      <div class="gap-item" style="border-left: 3px solid ${color};">
        <p class="gap-severity" style="color:${color};">${label}</p>
        <p class="value">${safeText(gap)}</p>
      </div>
    `
  }).join('')

  return `
    <section class="section">
      <h2 class="section-title">Gap Analysis</h2>
      <div class="gap-list">${items}</div>
    </section>
  `
}

function buildStrategicTensionsHtml(strategicAnalysis: Record<string, unknown>): string {
  const tensionFields = ['tensions', 'strategic_tensions', 'cultural_tensions', 'audience_tensions', 'key_tensions']
  let tensions: unknown[] = []

  for (const field of tensionFields) {
    if (Array.isArray(strategicAnalysis[field]) && (strategicAnalysis[field] as unknown[]).length > 0) {
      tensions = strategicAnalysis[field] as unknown[]
      break
    }
  }

  if (tensions.length === 0) {
    for (const [, value] of Object.entries(strategicAnalysis)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        tensions = value
        break
      }
    }
  }

  if (tensions.length === 0) {
    const insights = Object.entries(strategicAnalysis).filter(([, v]) => typeof v === 'string' && v.length > 0)
    if (insights.length === 0) return ''
    const rows = insights.map(([key, value]) => `
      <div class="card card-indigo">
        <p class="label label-indigo">${escapeHtml(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</p>
        <p class="value">${safeText(value)}</p>
      </div>
    `).join('')
    return `
      <section class="section">
        <h2 class="section-title">Strategic Analysis</h2>
        <div class="grid">${rows}</div>
      </section>
    `
  }

  const cards = tensions.map((tension, i) => {
    if (typeof tension === 'string') {
      return `<div class="card card-indigo"><p class="value">${safeText(tension)}</p></div>`
    }
    if (typeof tension === 'object' && tension !== null) {
      const t = tension as Record<string, unknown>
      const title = safeText(t.title ?? t.name ?? t.tension ?? `Tension ${i + 1}`)
      const description = safeText(t.description ?? t.insight ?? t.explanation ?? t.detail ?? '')
      return `
        <div class="card card-indigo">
          <p class="label label-indigo">Tension</p>
          <p class="value value-bold">${title}</p>
          ${description ? `<p class="value value-sub">${description}</p>` : ''}
        </div>
      `
    }
    return ''
  }).join('')

  return `
    <section class="section">
      <h2 class="section-title">Strategic Tensions</h2>
      <div class="grid">${cards}</div>
    </section>
  `
}

function buildSharpenedBriefHtml(strategicAnalysis: Record<string, unknown>, extractedBrief: Record<string, unknown>): string {
  const rewriteFields = ['rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief']
  let rewrittenBrief: string | null = null

  for (const field of rewriteFields) {
    if (typeof strategicAnalysis[field] === 'string' && (strategicAnalysis[field] as string).length > 0) {
      rewrittenBrief = strategicAnalysis[field] as string
      break
    }
  }

  if (!rewrittenBrief) {
    const parts: string[] = []
    const objective = extractedBrief.objective
    const audience = extractedBrief.target_audience
    const deliverables = extractedBrief.deliverables
    const tone = extractedBrief.tone
    const kpis = extractedBrief.kpis

    if (objective) parts.push(`**Objective:** ${String(objective)}`)
    if (audience) parts.push(`**Target Audience:** ${Array.isArray(audience) ? audience.join(', ') : String(audience)}`)
    if (deliverables) parts.push(`**Deliverables:** ${Array.isArray(deliverables) ? deliverables.join(', ') : String(deliverables)}`)
    if (tone) parts.push(`**Tone:** ${String(tone)}`)
    if (kpis) parts.push(`**Success Metrics:** ${Array.isArray(kpis) ? kpis.join(', ') : String(kpis)}`)

    if (parts.length === 0) return ''
    rewrittenBrief = parts.join('\n')
  }

  const lines = rewrittenBrief.split('\n').filter(Boolean)
  const linesHtml = lines.map(line => {
    const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.+)$/)
    if (boldMatch) {
      return `<div class="brief-row"><span class="brief-key">${escapeHtml(boldMatch[1])}</span><span class="value">${escapeHtml(boldMatch[2])}</span></div>`
    }
    return `<p class="value">${escapeHtml(line)}</p>`
  }).join('')

  return `
    <section class="section page-break-before">
      <h2 class="section-title">Sharpened Brief</h2>
      <div class="card">${linesHtml}</div>
    </section>
  `
}

function buildScoreHtml(score: number): string {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return `
    <section class="section score-section">
      <div class="score-wrapper">
        <svg width="140" height="140" style="transform:rotate(-90deg)">
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="10"/>
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${color}" stroke-width="10"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"/>
        </svg>
        <div class="score-text">
          <span class="score-number" style="color:${color};">${score}</span>
          <span class="score-denom">/100</span>
        </div>
      </div>
      <div class="score-info">
        <p class="score-label" style="color:${color};">${label}</p>
        <p class="score-sub">Brief quality score</p>
      </div>
    </section>
  `
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const plan = await getUserPlan(adminSupabase, user.id)
  if (plan === 'free') {
    return NextResponse.json({ error: 'PDF export requires a paid plan', code: 'PAID_PLAN_REQUIRED' }, { status: 403 })
  }

  let body: { extractedBrief?: Record<string, unknown>; strategicAnalysis?: Record<string, unknown>; gaps?: string[]; score?: number } = {}

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData()
    const raw = formData.get('data')
    if (typeof raw === 'string') {
      try { body = JSON.parse(raw) } catch { /* ignore */ }
    }
  } else {
    try { body = await req.json() } catch { /* ignore */ }
  }

  const extractedBrief = (body.extractedBrief ?? {}) as Record<string, unknown>
  const strategicAnalysis = (body.strategicAnalysis ?? {}) as Record<string, unknown>
  const gaps = Array.isArray(body.gaps) ? body.gaps as string[] : []
  const rawScore = typeof body.score === 'number' ? body.score : 0
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  const scoreHtml = buildScoreHtml(score)
  const extractedHtml = buildExtractedBriefHtml(extractedBrief)
  const gapsHtml = buildGapAnalysisHtml(gaps)
  const tensionsHtml = buildStrategicTensionsHtml(strategicAnalysis)
  const sharpenedHtml = buildSharpenedBriefHtml(strategicAnalysis, extractedBrief)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIDEN Brief Intelligence Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #111827;
      background: #fff;
      padding: 32px 40px;
      max-width: 794px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .page-header p {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .logo-badge {
      font-size: 11px;
      font-weight: 600;
      color: #4f46e5;
      background: #eef2ff;
      border-radius: 6px;
      padding: 4px 10px;
    }

    /* ── Score ── */
    .score-section {
      display: flex;
      align-items: center;
      gap: 24px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px 24px;
    }
    .score-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .score-text {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .score-number { font-size: 28px; font-weight: 700; line-height: 1; }
    .score-denom { font-size: 10px; color: #6b7280; }
    .score-label { font-size: 15px; font-weight: 600; }
    .score-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }

    /* ── Sections ── */
    .section { margin-top: 28px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    /* ── Cards / Grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      padding: 10px 12px;
    }
    .card-indigo {
      border-color: #c7d2fe;
      background: #eef2ff;
    }
    .label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .label-indigo { color: #818cf8; }
    .value { font-size: 12px; color: #1f2937; line-height: 1.5; }
    .value-bold { font-weight: 600; }
    .value-sub { color: #4338ca; margin-top: 4px; }

    /* ── Gap Analysis ── */
    .gap-list { display: flex; flex-direction: column; gap: 8px; }
    .gap-item {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
    }
    .gap-severity {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 3px;
    }
    .no-gaps {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #166534;
      font-weight: 500;
    }

    /* ── Sharpened Brief ── */
    .brief-row {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }
    .brief-key {
      min-width: 120px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
      padding-top: 2px;
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .page-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }

    /* ── Print styles ── */
    @media print {
      body { padding: 0; }
      @page {
        size: A4;
        margin: 20mm 18mm;
      }
      .page-break-before { page-break-before: always; }
      .score-section { break-inside: avoid; }
      .section { break-inside: avoid; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <div>
      <h1>AIDEN Brief Intelligence</h1>
      <p>AI-powered brief analysis report</p>
    </div>
    <span class="logo-badge">AIDEN</span>
  </header>

  ${scoreHtml}
  ${extractedHtml}
  ${gapsHtml}
  ${tensionsHtml}
  ${sharpenedHtml}

  <footer class="page-footer">
    <span>Generated by AIDEN Brief Intelligence</span>
    <span>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </footer>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
