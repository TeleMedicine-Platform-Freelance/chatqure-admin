import type { ReactNode, FC } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { applyLayoutBehavior } from '../../../behaviors';
import type { LayoutBehavior } from '../../../behaviors';

interface VerticalShellProps {
  behavior: LayoutBehavior;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export const VerticalShell: FC<VerticalShellProps> = ({ behavior, children, rightSlot: explicitRightSlot }) => {
  const rightSlot = explicitRightSlot || null;

  return (
    <div className={cn(
      'flex w-full',
      applyLayoutBehavior(behavior)
    )}>
      {children}
      {rightSlot}
    </div>
  );
};
