import "@/app/globals.css"
import { Inter } from 'next/font/google'
import { Metadata, Viewport } from "next"
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "QanDuAI - Content & Business Platform",
  description: "AI-Powered Content & Business Platform",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>
          {children}
          <Toaster richColors position="top-right" />
        </ClientLayout>
      </body>
    </html>
  )
}