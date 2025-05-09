"use client"

import dynamic from 'next/dynamic'

// Dynamically import the OMLPFeature with SSR disabled to prevent hydration issues
const OMLPFeature = dynamic(
  () => import('@/components/omlp/omlp-feature').then(mod => mod.OMLPFeature),
  { ssr: false }
)

export default function OMLPPage() {
  return <OMLPFeature />
}