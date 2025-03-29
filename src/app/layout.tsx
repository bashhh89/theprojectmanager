import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ["latin"] })

// Dynamically import the AppInitializer with no SSR to avoid hydration mismatches
const AppInitializer = dynamic(
  () => import('../components/AppInitializer').then(mod => mod.AppInitializer),
  { ssr: false }
)

export const metadata: Metadata = {
  title: "AI Assistant | Powered by Pollinations",
  description: "An AI assistant with text, image, and audio generation capabilities",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
        <Toaster />
        <AppInitializer />
      </body>
    </html>
  )
}
