import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BriefAnalysisData } from '@/components/BriefAnalysis'

export const runtime = 'edge'
export const alt = 'AIDEN Brief Analysis'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: { id: string }
}

function isBriefAnalysis(outputCopy: unknown): outputCopy is BriefAnalysisData {
  if (!outputCopy || typeof outputCopy !== 'object') return false
  const obj = outputCopy as Record<string, unknown>
  return typeof obj.score === 'number' && Array.isArray(obj.gaps)
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export default async function Image({ params }: Props) {
  const adminSupabase = createAdminClient()
  const { data: generation } = await adminSupabase
    .from('generations')
    .select('input_data, output_copy')
    .eq('id', params.id)
    .single()

  // Fallback for non-brief-analysis or missing data
  if (!generation || !isBriefAnalysis(generation.output_copy)) {
    const inputData = generation?.input_data as { productName?: string } | null
    const brandName = inputData?.productName ?? 'Preview'

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #6366f1 100%)',
            padding: '80px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '64px', fontWeight: 800, color: 'white', letterSpacing: '-2px', textAlign: 'center' }}>
              {brandName}
            </div>
            <div style={{ fontSize: '28px', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px', textTransform: 'uppercase' }}>
              AIDEN Landing Page
            </div>
          </div>
        </div>
      ),
      { ...size }
    )
  }

  const data = generation.output_copy as BriefAnalysisData
  const inputData = generation.input_data as { productName?: string; brandName?: string }
  const brandName = inputData?.brandName ?? inputData?.productName ?? 'Brand Analysis'
  const score = data.score
  const gapCount = data.gaps?.length ?? 0
  const scoreColor = getScoreColor(score)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0f0f',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1', letterSpacing: '4px', textTransform: 'uppercase' }}>
              AIDEN
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Brief Intelligence
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '8px 16px' }}>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Brief Analysis</div>
          </div>
        </div>

        {/* Brand name */}
        <div style={{ fontSize: '52px', fontWeight: 800, color: 'white', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '40px', maxWidth: '700px' }}>
          {brandName}
        </div>

        {/* Score + Gaps row */}
        <div style={{ display: 'flex', gap: '32px', marginTop: 'auto' }}>
          {/* Score card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)', border: `2px solid ${scoreColor}`, borderRadius: '16px', padding: '32px 48px', alignItems: 'center' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Score / 100
            </div>
          </div>

          {/* Gaps card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px 48px', alignItems: 'center' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
              {gapCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {gapCount === 1 ? 'Gap Found' : 'Gaps Found'}
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '16px', maxWidth: '380px' }}>
            <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              AI-powered brief analysis. Sharpen your brief before the work begins.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
