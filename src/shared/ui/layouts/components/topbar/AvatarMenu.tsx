import React from 'react';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { User, LogOut, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FloatingHover } from '@/shared/ui/components/FloatingHover';
import { useHoverBackground } from '@/shared/hooks/useHoverBackground';
import ThemeToggler from '@/shared/ui/components/ThemeToggler';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import type { ILogger } from '@/shared/utils/Logger';
import type { LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/components/ui/dialog';
import { Button } from '@/shadcn/components/ui/button';
import { FieldPassword } from '@/components/forms/composites/field';
import { toast } from 'sonner';

type MenuEntry = {
    type: 'item';
    key: string;
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
    variant?: 'default' | 'danger';
  } | { type: 'separator'; key: string };

const AvatarMenu: React.FC = () => {
  const { t } = useTranslation('common');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { rect, bind, clear } = useHoverBackground<HTMLDivElement>(containerRef);
  
  // Auth service for logout
  const authService = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const logger = useService<ILogger>(CORE_SYMBOLS.ILogger);
  const currentUser = authService.getCurrentUser();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    try {
      logger.info('Logout initiated from AvatarMenu');
      await authService.logout();
      // Navigation is handled by AuthEventHandler
    } catch (error) {
      logger.error('Logout failed', error);
    }
  }, [authService, logger]);

  const openChangePassword = React.useCallback(() => {
    setFormError(null);
    setIsChangePasswordOpen(true);
  }, []);

  const resetChangePasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleSubmitChangePassword = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!currentPassword || !newPassword || !confirmPassword) {
        setFormError('All fields are required.');
        return;
      }
      if (newPassword.length < 8) {
        setFormError('New password must be at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError('New password and confirmation do not match.');
        return;
      }

      try {
        setIsSubmitting(true);
        setFormError(null);
        logger.info('Change password form submitted');
        await authService.changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });
        toast.success('Password changed successfully. Please log in again.');
        setIsChangePasswordOpen(false);
        resetChangePasswordForm();
      } catch (error: unknown) {
        logger.error('Change password failed', error);
        const err = error as any;
        if (err && typeof err === 'object' && 'code' in err) {
          if (err.code === 'ADMIN_CURRENT_PASSWORD_INVALID') {
            const message = 'Current password is incorrect.';
            setFormError(message);
            toast.error(message);
            setIsSubmitting(false);
            return;
          }
          if (err.code === 'ADMIN_PASSWORD_UNCHANGED') {
            const message = 'New password must be different from current password.';
            setFormError(message);
            toast.error(message);
            setIsSubmitting(false);
            return;
          }
        }
        const message =
          error instanceof Error ? error.message : 'Failed to change password. Please try again.';
        setFormError(message);
        toast.error(message);
        setIsSubmitting(false);
      }
    },
    [authService, logger, currentPassword, newPassword, confirmPassword],
  );

  const menuEntries = React.useMemo<MenuEntry[]>(() => [
    {
      type: 'item',
      key: 'change-password',
      label: t('topbar.changePassword', { defaultValue: 'Change password' }),
      icon: KeyRound,
      onClick: openChangePassword,
      variant: 'default',
    },
    {
      type: 'separator',
      key: 'separator-logout',
    },
    {
      type: 'item',
      key: 'logout',
      label: t('topbar.logout', { defaultValue: 'Log out' }),
      icon: LogOut,
      onClick: handleLogout,
      variant: 'danger',
    },
  ], [t, handleLogout, openChangePassword]);

  return (
    <>
      <AnimatedDropdown placement="bottom-end" openOn="hover">
        <AnimatedDropdownTrigger asChild>
          <button
            className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border border-gray-200/70 dark:border-neutral-800"
            aria-label={t('topbar.account', { defaultValue: 'Account' })}
          >
            <span className="inline-flex items-center justify-center size-7 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden">
              <User className="size-4" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-2 rounded-full bg-green-500" />
          </button>
        </AnimatedDropdownTrigger>
        <AnimatedDropdownContent className="z-60 w-[280px]">
            <div className="px-3 pt-2 pb-3">
              <div className="text-sm font-semibold leading-tight">
                {currentUser?.name || 'Guest User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser?.email || 'Not logged in'}
              </div>
            </div>

            {/* Theme toggler */}
            <ThemeToggler size="sm" />

            <div ref={containerRef} className="relative p-1" onMouseLeave={clear}>
              <FloatingHover rect={rect} />
              {menuEntries.map((entry) =>
                entry.type === 'separator' ? (
                  <div key={entry.key} className="my-1 h-px bg-gray-200/70 dark:bg-neutral-800" />
                ) : (
                  <button
                    key={entry.key}
                    onClick={entry.onClick}
                    className={`relative w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      entry.variant === 'danger' ? 'text-red-600 dark:text-red-400' : ''
                    }`}
                    {...bind}
                  >
                    <entry.icon className="size-4" /> {entry.label}
                  </button>
                )
              )}
            </div>
        </AnimatedDropdownContent>
      </AnimatedDropdown>

      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setIsChangePasswordOpen(false);
            resetChangePasswordForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Update your password. After a successful change, you will be signed out and need to log in again.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitChangePassword} className="space-y-4">
            {formError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <FieldPassword
                label="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCurrentPassword(e.target.value);
                  setFormError(null);
                }}
                status={formError ? 'error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <FieldPassword
                label="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewPassword(e.target.value);
                  setFormError(null);
                }}
                status={formError ? 'error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <FieldPassword
                label="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setConfirmPassword(e.target.value);
                  setFormError(null);
                }}
                status={formError ? 'error' : undefined}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  if (!isSubmitting) {
                    setIsChangePasswordOpen(false);
                    resetChangePasswordForm();
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarMenu;
