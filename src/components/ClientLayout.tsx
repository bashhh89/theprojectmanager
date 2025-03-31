'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import ClientProvider from "@/components/ClientProvider"

const publicRoutes = ['/', '/login', '/signup']

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <ClientProvider>
      <div className="relative flex min-h-screen flex-col">
        {!isPublicRoute && <Sidebar />}
        <main className={`transition-all duration-300 ${!isPublicRoute ? 'ml-20 lg:ml-64' : ''}`}>
          {children}
        </main>
        <footer className="border-t border-border py-6 bg-muted/40">
          <div className="qandu-container">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-primary"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M12 8v8" />
                  <path d="m8.5 14 7-4" />
                  <path d="m8.5 10 7 4" />
                </svg>
                <span className="font-semibold">QanDu<span className="text-primary">AI</span></span>
              </div>
              <div className="mt-4 md:mt-0">
                <nav className="flex space-x-4 text-sm">
                  <a href="/about" className="text-muted-foreground hover:text-foreground qandu-transition-all">About</a>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground qandu-transition-all">Privacy</a>
                  <a href="/terms" className="text-muted-foreground hover:text-foreground qandu-transition-all">Terms</a>
                  <a href="/contact" className="text-muted-foreground hover:text-foreground qandu-transition-all">Contact</a>
                </nav>
              </div>
              <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} QanDu AI. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ClientProvider>
  )
} 