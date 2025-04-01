'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import ClientProvider from "@/components/ClientProvider"
import { AuthProvider } from '@/context/AuthContext'
import AuthWrapper from '@/components/AuthWrapper'
import { create } from 'zustand'

// Create a store for sidebar state
interface SidebarStore {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isExpanded: true,
  setIsExpanded: (expanded) => set({ isExpanded: expanded })
}))

const publicRoutes = ['/', '/login', '/signup', '/auth']

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)
  const { isExpanded } = useSidebarStore()

  return (
    <AuthProvider>
      <AuthWrapper>
        <ClientProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1">
              {!isPublicRoute && <Sidebar />}
              <main 
                className={`flex-1 transition-all duration-200 ease-in-out ${
                  !isPublicRoute ? (isExpanded ? 'ml-56' : 'ml-16') : ''
                }`}
              >
                <div className="container mx-auto p-4">
                  {children}
                </div>
              </main>
            </div>
            <footer className="w-full border-t border-border py-6 bg-muted/40">
              <div className="container mx-auto">
                <p className="text-sm text-muted-foreground text-center">
                  © {new Date().getFullYear()} QanDu AI. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </ClientProvider>
      </AuthWrapper>
    </AuthProvider>
  )
} 