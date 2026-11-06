import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-violet-600/20 text-violet-300 border-violet-500/40',
        secondary:
          'border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700',
        amber:
          'border-amber-500/40 bg-amber-500/20 text-amber-300',
        emerald:
          'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
        destructive:
          'border-transparent bg-red-900/40 text-red-300',
        outline: 'text-slate-300 border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
