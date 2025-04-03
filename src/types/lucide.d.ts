import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

declare module 'lucide-react' {
  export interface LucideIcon extends ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>> {}
  export const Eye: LucideIcon;
  export const Headphones: LucideIcon;
  export const Brain: LucideIcon;
  export const AlertTriangle: LucideIcon;
} 