import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL || 'Brief Sharpener <hello@aiden.services>'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

// Welcome email is exported for future use (e.g. auth callback on first login). Checklist is sent from /api/subscribe.

export async function sendWelcomeEmail(to: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Brief Sharpener',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111;">Welcome to Brief Sharpener</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            You're in. Brief Sharpener uses 7 strategic frameworks to score your creative briefs and pinpoint exactly where they need work.
          </p>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Head to your dashboard to start analysing briefs:
          </p>
          <a href="https://brief-sharpener.aiden.services/dashboard" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Go to Dashboard
          </a>
          <p style="font-size: 14px; color: #888; margin-top: 32px;">
            Questions? Reply to this email. We read everything.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function sendChecklistEmail(to: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Brief Sharpener Checklist',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111;">Your Brief Checklist</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Here are the 7 strategic frameworks Brief Sharpener evaluates every brief against:
          </p>
          <ol style="font-size: 15px; color: #333; line-height: 2;">
            <li><strong>Single-Minded Proposition</strong>: One clear, compelling idea</li>
            <li><strong>Human Truth</strong>: A genuine human insight</li>
            <li><strong>Tension</strong>: A clear creative tension to resolve</li>
            <li><strong>Desired Response</strong>: What the audience should think, feel, do</li>
            <li><strong>Measurability</strong>: Concrete success metrics</li>
            <li><strong>Creative Springboard</strong>: Room for big creative ideas</li>
            <li><strong>Strategic Alignment</strong>: Connected to business objectives</li>
          </ol>
          <a href="https://brief-sharpener.aiden.services/generate" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Analyse a Brief Now
          </a>
          <p style="font-size: 14px; color: #888; margin-top: 32px;">
            Questions? Reply to this email. We read everything.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send checklist email:', error)
  }
}
