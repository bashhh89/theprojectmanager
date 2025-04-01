"use client"

import React from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-md border border-input shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          id="color-picker"
        />
        <label 
          htmlFor="color-picker"
          className="px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 cursor-pointer"
        >
          Choose
        </label>
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  )
} 