// Utility types for UI components to make them compatible with React Server Components
import { FC, PropsWithChildren, HTMLAttributes, InputHTMLAttributes, ImgHTMLAttributes, LabelHTMLAttributes, ButtonHTMLAttributes, DetailedHTMLProps, RefAttributes } from 'react';

// This type allows us to use ForwardRefExoticComponent components in RSC
export type AnyComponent<P = any> = FC<P> | ((props: P) => JSX.Element | null);

export interface ButtonProps extends PropsWithChildren {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'ref'> {
  className?: string;
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  htmlFor?: string;
}

export interface IconProps {
  className?: string;
  size?: number;
}

export interface ImageProps extends Omit<DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, 'ref' | 'src' | 'alt'> {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export interface TabsProps extends PropsWithChildren {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export interface TabsListProps extends PropsWithChildren {
  className?: string;
}

export interface TabsTriggerProps extends PropsWithChildren {
  value: string;
  disabled?: boolean;
}

export interface TabsContentProps extends PropsWithChildren {
  value: string;
  className?: string;
}

export interface CardProps extends PropsWithChildren {
  className?: string;
}

export interface CardHeaderProps extends PropsWithChildren {
  className?: string;
}

export interface CardTitleProps extends PropsWithChildren {
  className?: string;
}

export interface CardDescriptionProps extends PropsWithChildren {
  className?: string;
}

export interface CardContentProps extends PropsWithChildren {
  className?: string;
}

export interface CardFooterProps extends PropsWithChildren {
  className?: string;
} 