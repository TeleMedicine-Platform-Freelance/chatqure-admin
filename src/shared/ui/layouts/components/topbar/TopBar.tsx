import React from 'react';
import UtilityOptions from '../UtilityOptions';
import MobileNavigationToggler from '../MobileNavigationToggler';
import { cn } from '@/shadcn/lib/utils';

interface TopBarProps {
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Mobile menu */}
      <MobileNavigationToggler />

      {/* Spacer to push utility options to the right on mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Right actions */}
      <UtilityOptions />
    </div>
  );
};

export default TopBar;
