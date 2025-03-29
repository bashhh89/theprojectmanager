"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const LinkComponent = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, children, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      className={cn("text-primary hover:text-primary/90", className)}
      {...props}
    >
      {children}
    </Link>
  )
})
LinkComponent.displayName = "LinkComponent"

export { LinkComponent } 