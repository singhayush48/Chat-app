import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Label = forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
});
Label.displayName = 'Label';
