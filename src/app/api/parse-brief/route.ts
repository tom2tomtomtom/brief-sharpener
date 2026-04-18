import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Magic-byte sniffers. Extension alone is a fig leaf — anyone can rename a
// zip bomb to .pdf and ship it straight into pdf-parse, which has a history
// of hangs and stack overflows on malformed input. Cross-check the declared
// extension against the first bytes of the buffer before we hand the file
// to any parser.
function looksLikePdf(buf: Buffer): boolean {
  // "%PDF-" at or near the start. Some PDFs have a handful of garbage bytes
  // before the header, so allow a small offset.
  return buf.includes(Buffer.from('%PDF-'), 0) && buf.indexOf(Buffer.from('%PDF-')) <= 1024
}

function looksLikeZip(buf: Buffer): boolean {
  // DOCX is really a ZIP. Real docx files start with either PK\x03\x04
  // (normal) or PK\x05\x06 (empty archive) or PK\x07\x08 (spanned).
  if (buf.length < 4) return false
  return (
    buf[0] === 0x50 && buf[1] === 0x4b &&
    (
      (buf[2] === 0x03 && buf[3] === 0x04) ||
      (buf[2] === 0x05 && buf[3] === 0x06) ||
      (buf[2] === 0x07 && buf[3] === 0x08)
    )
  )
}

function looksLikeOleDoc(buf: Buffer): boolean {
  // Legacy .doc (OLE Compound File) header.
  if (buf.length < 8) return false
  return (
    buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0 &&
    buf[4] === 0xa1 && buf[5] === 0xb1 && buf[6] === 0x1a && buf[7] === 0xe1
  )
}

export async function POST(request: NextRequest) {
  // Per-IP rate limit — no auth on this endpoint and PDF/DOCX parsing is
  // CPU-heavy. Limits an anonymous attacker to ~10 10MB-files/minute/IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before uploading again.', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(retryAfter ?? 60) } }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart form data with a "file" field.' },
      { status: 400 }
    )
  }

  try {
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()
    let text = ''

    if (name.endsWith('.txt') || name.endsWith('.md')) {
      // No reliable magic bytes for plain text. Guard against obvious
      // binary-masquerading-as-text by rejecting files that contain many
      // NUL bytes in the first 1KB — UTF-8 text never has U+0000.
      const sample = buffer.subarray(0, Math.min(1024, buffer.length))
      let nulCount = 0
      for (let i = 0; i < sample.length; i++) { if (sample[i] === 0) nulCount++ }
      if (nulCount > 2) {
        return NextResponse.json(
          { error: 'File does not appear to be plain text.' },
          { status: 400 }
        )
      }
      text = buffer.toString('utf-8')
    } else if (name.endsWith('.pdf')) {
      if (!looksLikePdf(buffer)) {
        return NextResponse.json(
          { error: 'File is not a valid PDF.' },
          { status: 400 }
        )
      }
      // Import pdf-parse/lib/pdf-parse directly to avoid index.js auto-test issue on serverless
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>
      const result = await pdfParse(buffer)
      text = result.text
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      // .docx is a ZIP, .doc is an OLE compound file. Reject anything that
      // isn't one of those before handing the buffer to mammoth, which
      // otherwise spends meaningful CPU trying to unzip arbitrary input.
      const isDocx = name.endsWith('.docx') && looksLikeZip(buffer)
      const isDoc = name.endsWith('.doc') && looksLikeOleDoc(buffer)
      if (!isDocx && !isDoc) {
        return NextResponse.json(
          { error: 'File does not match the declared Word format.' },
          { status: 400 }
        )
      }
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.' },
        { status: 400 }
      )
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Could not extract text from file. The file may be empty or image-based.' }, { status: 400 })
    }

    // Truncate to 50000 chars to handle long briefs with appendices
    const truncated = trimmed.slice(0, 50000)

    return NextResponse.json({ text: truncated, fileName: file.name, truncated: truncated.length < trimmed.length })
  } catch (err) {
    console.error('Parse brief error:', err)
    return NextResponse.json({ error: 'Failed to parse file. Please try pasting your brief instead.' }, { status: 500 })
  }
}
