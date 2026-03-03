import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { useTranslation } from 'react-i18next';
import LoginForm from '../../components/forms/LoginForm';

const LoginMinimal: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <LayoutMinimal
      header={
        <FormHeader
          title={t('title.login', 'Welcome back')}
          subtitle={t('subtitle.login', 'Please sign in to access the admin panel.')}
        />
      }
    >
      <LoginForm />
    </LayoutMinimal>
  );
};

export default LoginMinimal;
