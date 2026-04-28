import jsPDF from 'jspdf'
import type { BriefAnalysis } from '@/types/brief'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 18
const LINE_H = 5.2
const MAX_W = PAGE_W - MARGIN * 2
const BG: [number, number, number] = [10, 10, 10]
const TEXT: [number, number, number] = [255, 255, 255]
const MUTED: [number, number, number] = [180, 180, 180]
const ACCENT: [number, number, number] = [255, 46, 46]

function stripMarkdownLite(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function getExecutiveSummary(strategic: Record<string, unknown>): string {
  const raw =
    (strategic.aidenAnalysis as string | undefined) ??
    (strategic.aiden_analysis as string | undefined) ??
    ''
  return stripMarkdownLite(raw)
}

export function generateAnalysisPDF(analysis: BriefAnalysis, briefText: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let y = MARGIN

  const fillPageBg = () => {
    doc.setFillColor(BG[0], BG[1], BG[2])
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }

  const newPage = () => {
    doc.addPage()
    fillPageBg()
    y = MARGIN
  }

  const needSpace = (mm: number) => {
    if (y + mm > PAGE_H - MARGIN) {
      newPage()
    }
  }

  const writeHeading = (title: string, size = 12) => {
    needSpace(size * 0.5 + 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2])
    doc.text(title, MARGIN, y)
    y += size * 0.45 + 3
    doc.setDrawColor(60, 60, 60)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
  }

  const writeParagraph = (text: string, size = 9.5) => {
    const cleaned = stripMarkdownLite(text)
    if (!cleaned) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
    const lines = doc.splitTextToSize(cleaned, MAX_W) as string[]
    for (const line of lines) {
      needSpace(LINE_H * 0.95)
      doc.text(line, MARGIN, y)
      y += LINE_H * 0.95
    }
    y += 2
  }

  fillPageBg()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2])
  doc.text('Brief Sharpener | Analysis Report', MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
  doc.text(dateStr, MARGIN, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2])
  doc.text(`${analysis.score}`, MARGIN, y)
  doc.setFontSize(12)
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2])
  doc.text('/100 overall score', MARGIN + 22, y)
  y += 12

  const exec = getExecutiveSummary(analysis.strategicAnalysis)
  if (exec) {
    writeHeading('Executive summary', 11)
    writeParagraph(exec, 10)
  }

  if (analysis.scoreBreakdown?.dimensions?.length) {
    writeHeading('Scored dimensions', 11)
    for (const dim of analysis.scoreBreakdown.dimensions) {
      needSpace(14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2])
      doc.text(`${dim.dimension}`, MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2])
      doc.text(`${dim.score}/${dim.maxScore} (${dim.status})`, MARGIN + 75, y)
      y += LINE_H
      doc.setFontSize(9)
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
      const evLines = doc.splitTextToSize(dim.evidence || '', MAX_W) as string[]
      for (const line of evLines) {
        needSpace(LINE_H * 0.9)
        doc.text(line, MARGIN, y)
        y += LINE_H * 0.9
      }
      y += 3
    }
    needSpace(10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
    doc.text(
      `Structure: ${analysis.scoreBreakdown.structureScore}/10 · Completeness: ${analysis.scoreBreakdown.completenessScore}/10`,
      MARGIN,
      y
    )
    y += 8
  }

  writeHeading('Key gaps identified', 11)
  if (analysis.gaps.length === 0) {
    writeParagraph('No major gaps flagged. Brief covers the core checklist areas.', 10)
  } else {
    analysis.gaps.forEach((gap, i) => {
      writeParagraph(`${i + 1}. ${gap}`, 10)
    })
  }

  if (analysis.classicScores?.length) {
    writeHeading('Strategic standards', 11)
    const total = analysis.classicScores.reduce((s, c) => s + c.score, 0)
    const max = analysis.classicScores.reduce((s, c) => s + c.maxScore, 0)
    writeParagraph(`Combined: ${total}/${max} (${Math.round((total / max) * 100)}%)`, 9)
    for (const cs of analysis.classicScores) {
      needSpace(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2])
      doc.text(cs.standard, MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2])
      doc.text(`${cs.score}/${cs.maxScore}`, PAGE_W - MARGIN, y, { align: 'right' })
      y += LINE_H
      writeParagraph(`${cs.verdict} ${cs.advice ? `. ${cs.advice}` : ''}`.trim(), 8.5)
    }
  }

  const questions = analysis.clarifyingQuestions ?? []
  if (questions.length) {
    writeHeading('Recommendations & follow-ups', 11)
    questions.forEach((q, i) => {
      writeParagraph(`${i + 1}. ${q}`, 10)
    })
  }

  const brief = briefText.trim() || (analysis.briefText ?? '').trim()
  if (brief) {
    writeHeading('Original brief (reference)', 11)
    const excerpt = brief.length > 4000 ? `${brief.slice(0, 4000)}…` : brief
    writeParagraph(excerpt, 8.5)
  }

  doc.save(`brief-analysis-${analysis.score}.pdf`)
}
