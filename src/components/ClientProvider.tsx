'use client'

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
} 