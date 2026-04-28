/**
 * Preview page: public share link for a brief analysis.
 *
 * ACCESS MODEL: Secret link. Anyone with the UUID can view the analysis.
 * UUIDs are cryptographically random (v4) and not enumerable.
 * This is the same pattern used by Google Docs "anyone with the link" sharing.
 * We use an admin Supabase client (bypasses RLS) because the viewer may not be
 * the owner, or may not be authenticated at all.
 *
 * If owner-only access is needed in the future, add an auth check here and
 * compare the viewer's user_id against the generation's user_id.
 */
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTemplate, TemplateId } from '@/lib/templates'
import type { GeneratedContent } from '@/components/LandingPagePreview'
import type { BriefAnalysisData } from '@/components/BriefAnalysis'
import PreviewContent from './PreviewContent'
import AnalysisPreviewContent from './AnalysisPreviewContent'

interface PageProps {
  params: { id: string }
}

function isBriefAnalysis(outputCopy: unknown): outputCopy is BriefAnalysisData {
  if (!outputCopy || typeof outputCopy !== 'object') return false
  const obj = outputCopy as Record<string, unknown>
  return typeof obj.score === 'number' && Array.isArray(obj.gaps)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const adminSupabase = createAdminClient()
  const { data: generation } = await adminSupabase
    .from('generations')
    .select('input_data, output_copy')
    .eq('id', params.id)
    .single()

  if (!generation) return { title: 'Preview not found' }

  if (isBriefAnalysis(generation.output_copy)) {
    const data = generation.output_copy as BriefAnalysisData
    return { title: `Brief Score: ${data.score}/100 | AIDEN Brief Intelligence` }
  }

  const inputData = generation.input_data as { productName?: string }
  return { title: `${inputData.productName ?? 'Preview'} | Landing Page Preview` }
}

export default async function PreviewPage({ params }: PageProps) {
  const adminSupabase = createAdminClient()

  const { data: generation, error } = await adminSupabase
    .from('generations')
    .select('id, input_data, output_copy, template_id')
    .eq('id', params.id)
    .single()

  if (error || !generation) {
    notFound()
  }

  if (isBriefAnalysis(generation.output_copy)) {
    const headersList = headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const protocol = host.startsWith('localhost') ? 'http' : 'https'
    const previewUrl = `${protocol}://${host}/preview/${params.id}`

    return (
      <AnalysisPreviewContent
        data={generation.output_copy as BriefAnalysisData}
        previewUrl={previewUrl}
      />
    )
  }

  const outputCopy = generation.output_copy as GeneratedContent
  const inputData = generation.input_data as { productName: string }
  const template = getTemplate((generation.template_id ?? 'saas') as TemplateId)

  return (
    <PreviewContent
      data={outputCopy}
      productName={inputData.productName}
      template={template}
    />
  )
}
