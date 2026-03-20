import LandingPageForm from '@/components/LandingPageForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            AIDEN Landing Page Generator
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Tell us about your product and we&apos;ll generate high-converting copy instantly.
          </p>
        </div>

        {/* Form / Preview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <LandingPageForm />
        </div>
      </div>
    </main>
  )
}
