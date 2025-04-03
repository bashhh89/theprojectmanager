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

// Updated with more comprehensive public routes
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/register',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/register/confirmation'
]

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const cleanedPathname = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  
  // Check if the cleaned pathname is in the public routes list
  const isPublicRoute = publicRoutes.includes(cleanedPathname)
  const { isExpanded } = useSidebarStore()

  // --- Add Logging --- 
  console.log("ClientLayout: Pathname (raw):", pathname);
  console.log("ClientLayout: Pathname (cleaned):", cleanedPathname);
  console.log("ClientLayout: Is Public Route?", isPublicRoute);
  console.log("ClientLayout: Should render Sidebar?", !isPublicRoute);
  // --- End Logging --- 

  return (
    <AuthProvider>
      <AuthWrapper>
        <ClientProvider>
          <div className="flex min-h-screen flex-col bg-zinc-900 text-zinc-100">
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
            <footer className="w-full border-t border-zinc-700/50 py-6 bg-zinc-900">
              <div className="container mx-auto">
                <p className="text-sm text-zinc-400 text-center">
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