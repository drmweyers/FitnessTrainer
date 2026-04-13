// Dev-only preview route for Stream C 3-panel builder UI.
// Gate: only accessible in development. Remove or keep behind NODE_ENV check before prod merge.

import { redirect } from 'next/navigation'

// Block access in production
if (process.env.NODE_ENV === 'production') {
  redirect('/')
}

export default function BuilderPreviewPage() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-sm text-yellow-800">
        DEV PREVIEW — Stream C builder UI. This route is development-only.
      </div>
      <BuilderPreviewClient />
    </div>
  )
}

// Client component for the preview
import BuilderPreviewClient from './BuilderPreviewClient'
