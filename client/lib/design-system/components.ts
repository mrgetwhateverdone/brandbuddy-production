/**
 * This part of the code provides standardized component variants and styles
 * Ensures consistency across all UI components using design tokens
 */

import { type VariantProps, cva } from 'class-variance-authority';

// This part of the code defines button component variants
export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        destructive: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
        outline: 'border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 focus:ring-primary-500',
        secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
        ghost: 'hover:bg-gray-100 hover:text-gray-900 focus:ring-primary-500',
        link: 'underline-offset-4 hover:underline text-primary-600 focus:ring-primary-500'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

// This part of the code defines badge component variants
export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        destructive: 'bg-error-100 text-error-800 hover:bg-error-200',
        success: 'bg-success-100 text-success-800 hover:bg-success-200',
        warning: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
        outline: 'text-foreground border border-gray-200 hover:bg-gray-100'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// This part of the code defines alert component variants
export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 text-gray-900 border-gray-200',
        destructive: 'bg-error-50 text-error-900 border-error-200 [&>svg]:text-error-600',
        success: 'bg-success-50 text-success-900 border-success-200 [&>svg]:text-success-600',
        warning: 'bg-warning-50 text-warning-900 border-warning-200 [&>svg]:text-warning-600'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// This part of the code defines input component variants
export const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-200 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-error-300 focus:border-error-500 focus:ring-error-500',
        success: 'border-success-300 focus:border-success-500 focus:ring-success-500'
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

// This part of the code defines card component variants
export const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        elevated: 'bg-white border-gray-200 shadow-md',
        ghost: 'bg-transparent border-transparent shadow-none'
      },
      padding: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        none: 'p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default'
    }
  }
);

// This part of the code provides type exports for component props
export type ButtonProps = VariantProps<typeof buttonVariants>;
export type BadgeProps = VariantProps<typeof badgeVariants>;
export type AlertProps = VariantProps<typeof alertVariants>;
export type InputProps = VariantProps<typeof inputVariants>;
export type CardProps = VariantProps<typeof cardVariants>;

// This part of the code defines status color mappings
export const statusColors = {
  completed: 'success',
  shipped: 'primary',
  processing: 'warning',
  pending: 'secondary',
  delayed: 'destructive',
  cancelled: 'secondary',
  at_risk: 'destructive',
  on_time: 'success',
  breach: 'destructive'
} as const;

// This part of the code defines risk level mappings
export const riskLevelColors = {
  low: 'success',
  medium: 'warning',
  high: 'destructive'
} as const;
