"use client";

import { BarChart3, Grid, ListFilter, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductNavProps {
  className?: string;
}

export function ProductNav({ className }: ProductNavProps) {
  const pathname = usePathname();
  
  const links = [
    {
      href: "/products",
      label: "All Products",
      icon: Grid,
      active: pathname === "/products"
    },
    {
      href: "/products/categories",
      label: "Categories",
      icon: Tag,
      active: pathname === "/products/categories"
    },
    {
      href: "/products/analytics",
      label: "Analytics",
      icon: BarChart3,
      active: pathname === "/products/analytics"
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Products & Services</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products/filter">
              <ListFilter className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        {links.map((link) => (
          <Button
            key={link.href}
            variant={link.active ? "secondary" : "ghost"}
            className={cn("w-full justify-start", {
              "bg-secondary": link.active,
            })}
            asChild
          >
            <Link href={link.href}>
              <link.icon className="mr-2 h-4 w-4" />
              {link.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
} 