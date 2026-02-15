import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FieldEmail from '../../../../../shared/ui/components/forms/composites/field/FieldEmail';
import { FieldPassword } from '@/components/forms/composites/field';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({ 
  email: z.string().email('Please enter a valid email'), 
  password: z.string().min(8, 'Password must be at least 8 characters'), 
  displayName: z.string().min(2, 'Display name must be at least 2 characters') 
});

type Values = z.infer<typeof schema>;

const RegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const onSubmit = async (values: Values) => {
    // Admin registration is not available - show message
    alert('Admin registration is not available. Please contact your administrator to create an admin account.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm">
        <strong>Note:</strong> Admin registration is not available. Please contact your administrator to create an admin account.
      </div>

      <div>
        <FieldEmail {...register('email')} />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Display name</label>
        <input className="w-full rounded-lg border px-3 h-10" {...register('displayName')} />
        {errors.displayName && <p className="text-red-600 text-xs mt-1">{errors.displayName.message}</p>}
      </div>
      <div>
        <FieldPassword {...register('password')} />
        {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <ActionButton type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating…' : 'Request Admin Access'}
      </ActionButton>
    </form>
  );
};

export default RegisterForm;
