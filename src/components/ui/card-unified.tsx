import React from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'muted' | 'highlight' | 'primary' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  clickable?: boolean;
  fullWidth?: boolean;
  noPadding?: boolean;
  asChild?: boolean;
};

type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
};

type CardContentProps = {
  children: React.ReactNode;
  className?: string;
};

type CardFooterProps = {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
};

type CardTitleProps = {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

type CardDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = React.forwardRef<
  HTMLDivElement,
  CardProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'default',
      clickable = false,
      fullWidth = false,
      noPadding = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? React.Fragment : 'div';
    
    return (
      <Comp
        ref={ref}
        className={cn(
          'qandu-card overflow-hidden',
          {
            // Variants
            'bg-card text-card-foreground border-border': variant === 'default',
            'bg-background text-foreground border-border': variant === 'outline',
            'bg-muted text-muted-foreground border-muted': variant === 'muted',
            'bg-primary/10 text-primary border-primary/20': variant === 'primary',
            'bg-secondary/10 text-secondary border-secondary/20': variant === 'secondary',
            'bg-card border-primary/30': variant === 'highlight',
            
            // Sizes
            'rounded-lg border shadow-sm': size === 'default',
            'rounded-md border shadow-sm': size === 'sm',
            'rounded-xl border shadow-md': size === 'lg',
            
            // Behavior
            'hover:shadow-md hover:border-primary/40 cursor-pointer transition-all': clickable,
            'w-full': fullWidth,
            'p-0': noPadding,
            'p-6': !noPadding,
          },
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({
  children,
  className,
  actions,
  ...props
}: CardHeaderProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        {
          'flex flex-row justify-between items-center space-y-0': actions,
        },
        className
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export const CardContent = ({
  children,
  className,
  ...props
}: CardContentProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
};

CardContent.displayName = 'CardContent';

export const CardFooter = ({
  children,
  className,
  divider = false,
  ...props
}: CardFooterProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex items-center p-6 pt-0',
        {
          'border-t border-border pt-4 mt-4': divider,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

export const CardTitle = ({
  children,
  className,
  as: Component = 'h3',
  ...props
}: CardTitleProps & React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <Component
      className={cn(
        'font-semibold leading-none tracking-tight text-foreground',
        {
          'text-2xl': Component === 'h1',
          'text-xl': Component === 'h2',
          'text-lg': Component === 'h3',
          'text-base': Component === 'h4' || Component === 'h5' || Component === 'h6',
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

CardTitle.displayName = 'CardTitle';

export const CardDescription = ({
  children,
  className,
  ...props
}: CardDescriptionProps & React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
};

CardDescription.displayName = 'CardDescription'; 