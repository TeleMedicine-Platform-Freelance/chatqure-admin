import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import { ADMIN_PATHS } from '../routes/paths';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shadcn/components/ui/button';
import { ArrowLeft, Loader2, Phone, Mail, User } from 'lucide-react';

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);

  const { data: patient, isLoading, isError } = useQuery({
    queryKey: ['patient-details', id],
    queryFn: () => repository.getPatientById(id!),
    enabled: !!id,
  });

  const goBack = useCallback(() => {
    navigate(ADMIN_PATHS.PATIENTS);
  }, [navigate]);

  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">Missing patient ID.</p>
        <Button variant="link" onClick={goBack} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading patient details...</span>
      </div>
    );

  if (isError || !patient) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">Failed to load patient details.</p>
        <Button variant="link" onClick={goBack} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{patient.name || 'Patient Details'}</h1>
        <div className="w-24" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Name
              </p>
              <p className="text-sm font-medium">{patient.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </p>
              <p className="text-sm">{patient.phoneNumber || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </p>
              <p className="text-sm">{patient.email || '-'}</p>
            </div>
            {patient.dateOfBirth && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="text-sm">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {patient.walletBalance !== undefined && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                <p className="text-sm font-medium">₹{patient.walletBalance || '0'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
