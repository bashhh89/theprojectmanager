import { ForwardRefExoticComponent, RefAttributes } from 'react';

declare module '@/components/ui/select' {
  interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: React.ReactNode;
  }

  interface SelectTriggerProps {
    className?: string;
    children?: React.ReactNode;
  }

  interface SelectValueProps {
    placeholder?: string;
  }

  interface SelectContentProps {
    className?: string;
    children?: React.ReactNode;
  }

  interface SelectItemProps {
    value: string;
    children?: React.ReactNode;
  }

  export const Select: ForwardRefExoticComponent<SelectProps & RefAttributes<HTMLDivElement>>;
  export const SelectTrigger: ForwardRefExoticComponent<SelectTriggerProps & RefAttributes<HTMLButtonElement>>;
  export const SelectValue: ForwardRefExoticComponent<SelectValueProps & RefAttributes<HTMLSpanElement>>;
  export const SelectContent: ForwardRefExoticComponent<SelectContentProps & RefAttributes<HTMLDivElement>>;
  export const SelectItem: ForwardRefExoticComponent<SelectItemProps & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/input' {
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }

  export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
}

declare module '@/components/ui/tooltip' {
  interface TooltipProps {
    children?: React.ReactNode;
  }

  interface TooltipTriggerProps {
    children?: React.ReactNode;
  }

  interface TooltipContentProps {
    children?: React.ReactNode;
    className?: string;
  }

  export const Tooltip: ForwardRefExoticComponent<TooltipProps & RefAttributes<HTMLDivElement>>;
  export const TooltipTrigger: ForwardRefExoticComponent<TooltipTriggerProps & RefAttributes<HTMLDivElement>>;
  export const TooltipContent: ForwardRefExoticComponent<TooltipContentProps & RefAttributes<HTMLDivElement>>;
  export const TooltipProvider: ForwardRefExoticComponent<{ children?: React.ReactNode }>;
}

declare module '@/components/ui/badge' {
  interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }

  export const Badge: ForwardRefExoticComponent<BadgeProps & RefAttributes<HTMLDivElement>>;
} 