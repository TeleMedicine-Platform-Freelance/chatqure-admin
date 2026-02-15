import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import { PageHeader } from '@/shared/ui/components/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Label } from '@/shared/ui/shadcn/components/ui/label';
import { toast } from 'sonner';

const AddTestMoneyPage: React.FC = () => {
  const adminRepo = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');

  const addTestMoneyMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const numericAmount = Number(amount);
      if (!accountId.trim()) {
        throw new Error('Account ID is required');
      }
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }
      await adminRepo.addTestMoney({
        accountId: accountId.trim(),
        amount: numericAmount,
      });
    },
    onSuccess: () => {
      toast.success('Test money added successfully');
      setAmount('');
    },
    onError: (error: unknown) => {
      const message =
        (error as any)?.message || 'Failed to add test money';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    addTestMoneyMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add Test Money"
        subtitle="Create a test wallet recharge for a patient by ID."
      />

      <Card>
        <CardHeader>
          <CardTitle>Dev: Add Test Money</CardTitle>
          <CardDescription>
            This endpoint uses the authenticated admin&apos;s JWT (Authorization header).
            Provide an account ID and base amount to credit to the patient wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="UUID of the account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Base amount to add to wallet"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAccountId('');
              setAmount('');
            }}
            disabled={addTestMoneyMutation.status === 'pending'}
          >
            Clear
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={addTestMoneyMutation.status === 'pending'}
          >
            {addTestMoneyMutation.status === 'pending' ? 'Adding...' : 'Add Test Money'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddTestMoneyPage;

