import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { DoctorDetails } from '../../domain/models/Doctor';
import { ADMIN_PATHS } from '../routes/paths';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/components/ui/dialog';
import { Label } from '@/shadcn/components/ui/label';
import { Textarea } from '@/shadcn/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  Ban,
  UserCheck,
  FileCheck,
  ExternalLink,
  ImageIcon,
  Wallet,
  Calendar,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog';

type Section = 'basic' | 'professional' | 'kyc' | 'profile';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'basic', label: 'Basic Info', icon: <User className="h-4 w-4" /> },
  { id: 'professional', label: 'Professional Info', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'kyc', label: 'KYC Documents', icon: <FileCheck className="h-4 w-4" /> },
  { id: 'profile', label: 'Profile & Photos', icon: <ImageIcon className="h-4 w-4" /> },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : format(d, 'dd MMM yyyy, HH:mm');
  } catch {
    return value;
  }
}

function BasicDetailsCard({ doctor }: { doctor: DoctorDetails }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Name</p>
        <p className="text-sm font-medium">{doctor.name || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Token Number</p>
        <p className="text-sm">{doctor.tokenNumber || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> Phone Number
        </p>
        <p className="text-sm">{doctor.phoneNumber}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" /> Email
        </p>
        <p className="text-sm">{doctor.email || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Gender</p>
        <p className="text-sm">{doctor.gender ?? '—'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Account Status</p>
        <Badge variant={doctor.accountStatus === 'ACTIVE' ? 'default' : 'secondary'}>
          {doctor.accountStatus}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">KYC Status</p>
        <Badge
          variant={
            doctor.kycStatus === 'VERIFIED'
              ? 'default'
              : doctor.kycStatus === 'REJECTED'
                ? 'destructive'
                : doctor.kycStatus === 'SUBMITTED'
                  ? 'secondary'
                  : 'outline'
          }
        >
          {doctor.kycStatus}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Medical Council</p>
        <p className="text-sm">
          {doctor.medicalCouncil
            ? [doctor.medicalCouncil.name, doctor.medicalCouncil.state].filter(Boolean).join(', ') || '—'
            : doctor.medicalCouncilOther
              ? `Other: ${doctor.medicalCouncilOther}`
              : '—'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Medical Approach</p>
        <p className="text-sm">{doctor.medicalApproach || '—'}</p>
      </div>
      <div className="space-y-1 flex items-center gap-1">
        <Wallet className="h-3 w-3 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
          <p className="text-sm">₹{doctor.walletBalance ?? '0'}</p>
        </div>
      </div>
      <div className="space-y-1 sm:col-span-2 border-t pt-4 mt-2">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" /> KYC & account dates
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {doctor.kycStatus === 'REJECTED' && doctor.kycRejectionReason && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Rejection reason</p>
              <p className="text-sm text-destructive">{doctor.kycRejectionReason}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">KYC submitted</p>
            <p className="text-sm">{formatDate(doctor.kycSubmittedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">KYC verified</p>
            <p className="text-sm">{formatDate(doctor.kycVerifiedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Account created</p>
            <p className="text-sm">{formatDate(doctor.accountCreatedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Profile updated</p>
            <p className="text-sm">{formatDate(doctor.updatedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last login
            </p>
            <p className="text-sm">{formatDate(doctor.lastLoginAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocLink({
  url,
  label,
  onView,
}: {
  url: string | null;
  label: string;
  onView: (url: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  if (!url) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <button
      type="button"
      onClick={async () => {
        setLoading(true);
        try {
          await onView(url);
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="text-sm text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          {label}
          <ExternalLink className="h-3 w-3" />
        </>
      )}
    </button>
  );
}

function KycDocumentsCard({
  doctor,
  onViewDocument,
}: {
  doctor: DoctorDetails;
  onViewDocument: (documentUrl: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review these documents before approving the doctor. Private documents are loaded via a temporary link (same as the mobile app).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Aadhaar Number</p>
          <p className="text-sm">{doctor.aadhaarNumber || '—'}</p>
        </div>
        <div className="space-y-1 sm:col-span-2" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Aadhaar Front</p>
          <DocLink url={doctor.aadhaarFrontUrl} label="View document" onView={onViewDocument} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Aadhaar Back</p>
          <DocLink url={doctor.aadhaarBackUrl} label="View document" onView={onViewDocument} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">PAN Number</p>
          <p className="text-sm">{doctor.panNumber || '—'}</p>
        </div>
        <div className="space-y-1" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">PAN Card</p>
          <DocLink url={doctor.panCardUrl} label="View document" onView={onViewDocument} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Education Certificate</p>
          <DocLink url={doctor.educationCertUrl} label="View document" onView={onViewDocument} />
        </div>
      </div>
    </div>
  );
}

function ProfessionalDetailsCard({ doctor }: { doctor: DoctorDetails }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Specialization</p>
        <p className="text-sm">{doctor.specialization?.name || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Experience</p>
        <p className="text-sm">
          {doctor.experience
            ? `${doctor.experience} ${doctor.experience === 1 ? 'year' : 'years'}`
            : '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
        <p className="text-sm">{doctor.registrationNumber || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Registration Year</p>
        <p className="text-sm">{doctor.registrationYear || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Rate Per Minute</p>
        <p className="text-sm">
          {doctor.ratePerMinute ? `₹${doctor.ratePerMinute}` : '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Rating</p>
        <p className="text-sm">
          {doctor.ratingAvg ? (
            <>
              {doctor.ratingAvg} ({doctor.ratingCount}{' '}
              {doctor.ratingCount === 1 ? 'review' : 'reviews'})
            </>
          ) : (
            '-'
          )}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Current Workplace</p>
        <p className="text-sm">{doctor.currentWorkplace || '—'}</p>
      </div>
      {doctor.languages && doctor.languages.length > 0 && (
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">Languages</p>
          <div className="flex flex-wrap gap-2">
            {doctor.languages.map((lang) => (
              <Badge key={lang.id} variant="secondary">
                {lang.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {doctor.about && (
        <div className="space-y-2 sm:col-span-2 border-t pt-4 mt-2">
          <p className="text-sm font-medium text-muted-foreground">About</p>
          <p className="text-sm whitespace-pre-wrap">{doctor.about}</p>
        </div>
      )}
    </div>
  );
}

function ProfilePhotosCard({
  doctor,
  onViewDocument,
}: {
  doctor: DoctorDetails;
  onViewDocument: (documentUrl: string) => Promise<void>;
}) {
  const hasProfile = !!doctor.profilePictureUrl;
  const photos = doctor.photoUrls ?? [];
  const hasPhotos = photos.length > 0;
  if (!hasProfile && !hasPhotos) {
    return (
      <p className="text-sm text-muted-foreground">No profile picture or photos uploaded.</p>
    );
  }
  return (
    <div className="space-y-6">
      {hasProfile && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Profile Picture</p>
          <div className="flex items-start gap-4">
            <DocLink
              url={doctor.profilePictureUrl ?? null}
              label="View profile picture"
              onView={onViewDocument}
            />
          </div>
        </div>
      )}
      {hasPhotos && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Service Photos ({photos.length})</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <DocLink
                key={url}
                url={url}
                label={`View photo ${i + 1}`}
                onView={onViewDocument}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<Section>('basic');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);

  const { data: doctor, isLoading, isError } = useQuery({
    queryKey: ['doctor-details', id],
    queryFn: () => repository.getDoctorById(id!),
    enabled: !!id,
  });

  const approveKycMutation = useMutation({
    mutationFn: ({ doctorId, notes }: { doctorId: string; notes?: string }) =>
      repository.approveKyc(doctorId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-details', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setApproveDialogOpen(false);
      setApproveNotes('');
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      repository.rejectKyc(doctorId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-details', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectError('');
    },
  });

  const suspendDoctorMutation = useMutation({
    mutationFn: (doctorId: string) => repository.suspendDoctor(doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-details', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setSuspendConfirmOpen(false);
      toast.success('Doctor suspended. They have been logged out and must contact admin to be restored.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to suspend doctor');
    },
  });

  const unsuspendDoctorMutation = useMutation({
    mutationFn: (doctorId: string) => repository.unsuspendDoctor(doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-details', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor unsuspended. They can log in again.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to unsuspend doctor');
    },
  });

  const openApproveDialog = useCallback(() => {
    setApproveDialogOpen(true);
  }, []);

  const confirmApproveKyc = useCallback(() => {
    if (!id) return;
    approveKycMutation.mutate({ doctorId: id, notes: approveNotes.trim() || undefined });
  }, [id, approveNotes, approveKycMutation]);

  const openRejectDialog = useCallback(() => {
    setRejectDialogOpen(true);
  }, []);

  const confirmRejectKyc = useCallback(() => {
    if (!id) return;
    const value = rejectReason.trim();
    if (!value) {
      setRejectError('Please provide a reason for rejection.');
      return;
    }
    rejectKycMutation.mutate({ doctorId: id, reason: value });
  }, [id, rejectReason, rejectKycMutation]);

  const confirmSuspend = useCallback(() => {
    if (!id) return;
    suspendDoctorMutation.mutate(id);
  }, [id, suspendDoctorMutation]);

  const handleUnsuspend = useCallback(() => {
    if (!id) return;
    unsuspendDoctorMutation.mutate(id);
  }, [id, unsuspendDoctorMutation]);

  const goBack = useCallback(() => {
    navigate(ADMIN_PATHS.DOCTORS);
  }, [navigate]);

  const handleViewDocument = useCallback(
    async (documentUrl: string) => {
      try {
        const url = await repository.getPresignedGetUrl(documentUrl);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load document');
      }
    },
    [repository]
  );

  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">Missing doctor ID.</p>
        <Button variant="link" onClick={goBack} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading doctor details...</span>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">Failed to load doctor details.</p>
        <Button variant="link" onClick={goBack} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{doctor.name || 'Doctor Details'}</h1>
        <div className="w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: section rows */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sections</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <div className="flex flex-col">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    selectedSection === section.id && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column: details card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {selectedSection === 'basic' && 'Basic Information'}
              {selectedSection === 'professional' && 'Professional Information'}
              {selectedSection === 'kyc' && 'KYC Documents'}
              {selectedSection === 'profile' && 'Profile & Photos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSection === 'basic' && <BasicDetailsCard doctor={doctor} />}
            {selectedSection === 'professional' && <ProfessionalDetailsCard doctor={doctor} />}
            {selectedSection === 'kyc' && (
              <KycDocumentsCard doctor={doctor} onViewDocument={handleViewDocument} />
            )}
            {selectedSection === 'profile' && (
              <ProfilePhotosCard doctor={doctor} onViewDocument={handleViewDocument} />
            )}

            {selectedSection === 'kyc' && doctor.kycStatus === 'SUBMITTED' && (
              <div className="flex flex-col sm:flex-row gap-2 pt-6 mt-6 border-t">
                <Button
                  onClick={openApproveDialog}
                  disabled={approveKycMutation.isPending || rejectKycMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve KYC
                </Button>
                <Button
                  onClick={openRejectDialog}
                  disabled={approveKycMutation.isPending || rejectKycMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject KYC
                </Button>
              </div>
            )}

            {selectedSection === 'basic' && doctor.kycStatus === 'SUBMITTED' && (
              <div className="flex flex-col sm:flex-row gap-2 pt-6 mt-6 border-t">
                <Button
                  onClick={openApproveDialog}
                  disabled={approveKycMutation.isPending || rejectKycMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve KYC
                </Button>
                <Button
                  onClick={openRejectDialog}
                  disabled={approveKycMutation.isPending || rejectKycMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject KYC
                </Button>
              </div>
            )}

            {selectedSection === 'basic' && (
              <div className="flex flex-col sm:flex-row gap-2 pt-6 mt-6 border-t">
                {doctor.accountStatus === 'SUSPENDED' ? (
                  <Button
                    onClick={handleUnsuspend}
                    disabled={unsuspendDoctorMutation.isPending}
                    variant="secondary"
                    className="flex-1"
                  >
                    {unsuspendDoctorMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Unsuspend doctor
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSuspendConfirmOpen(true)}
                    disabled={suspendDoctorMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend doctor
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve KYC dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={(open) => {
        if (!open && !approveKycMutation.isPending) {
          setApproveDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optionally add internal notes for this approval. These are stored for audit, not shown to the doctor.
            </p>
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Verified all documents"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => !approveKycMutation.isPending && setApproveDialogOpen(false)}
              disabled={approveKycMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmApproveKyc}
              disabled={approveKycMutation.isPending}
            >
              {approveKycMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend doctor confirmation */}
      <AlertDialog open={suspendConfirmOpen} onOpenChange={setSuspendConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log the doctor out and block access until you unsuspend them. They will see a message to contact support. You can restore access anytime with &quot;Unsuspend doctor&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendDoctorMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              disabled={suspendDoctorMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {suspendDoctorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                'Suspend'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject KYC dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        if (!open && !rejectKycMutation.isPending) {
          setRejectDialogOpen(false);
          setRejectError('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a clear, actionable reason. This will be shown to the doctor.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError('');
                }}
                rows={3}
                maxLength={500}
                placeholder="Aadhaar photo is unclear, please re-upload"
              />
              {rejectError && (
                <p className="text-sm text-destructive">{rejectError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => !rejectKycMutation.isPending && setRejectDialogOpen(false)}
              disabled={rejectKycMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRejectKyc}
              disabled={rejectKycMutation.isPending}
            >
              {rejectKycMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
