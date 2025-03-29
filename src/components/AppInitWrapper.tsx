"use client"

import dynamic from 'next/dynamic'

// Dynamically import the AppInitializer with no SSR to avoid hydration mismatches
const AppInitializer = dynamic(
  () => import('./AppInitializer').then(mod => mod.AppInitializer),
  { ssr: false }
)

export default function AppInitWrapper() {
  return <AppInitializer />
} 