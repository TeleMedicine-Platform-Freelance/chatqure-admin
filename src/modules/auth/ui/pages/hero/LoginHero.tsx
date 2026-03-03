import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import LoginForm from '../../components/forms/LoginForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { useTranslation } from 'react-i18next';
import { AUTH_PATHS_HERO } from '../../routes/paths';
import Hero from '../../layouts/Hero';

const LoginHero: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <LayoutHero
      header={
        <FormHeader
          title={t('title.login', 'Welcome back')}
          subtitle={t('subtitle.login', 'Please sign in to access the admin panel.')}
        />
      }
      hero={<Hero />}
    >
      <LoginForm forgotUrl={AUTH_PATHS_HERO.FORGOT_PASSWORD_HERO} />
    </LayoutHero>
  );
};

export default LoginHero;
