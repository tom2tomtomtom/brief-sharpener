import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AIDEN Landing Page Generator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            AI Landing Page Generator
          </div>
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.85)',
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Describe your product. Get a conversion-ready landing page in 30 seconds.
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '24px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            AIDEN
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
