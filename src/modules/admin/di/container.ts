/**
 * Admin Module DI Container
 */

import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { ADMIN_ROUTES } from '../ui/routes';
import { ADMIN_SYMBOLS } from './symbols';
import { AdminRepository } from '../infrastructure/repositories/AdminRepository';
import type { IAdminRepository } from '../domain/ports/IAdminRepository';

export function createAdminModule(container: Container): AppModule {
  return {
    name: 'admin',
    routes: ADMIN_ROUTES,
    registerBindings: () => {
      container
        .bind<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository)
        .to(AdminRepository)
        .inSingletonScope();
    },
  };
}
