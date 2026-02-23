import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type {
  AdminAnalyticsOverview,
  AdminDashboardMetrics,
  AdminDashboardMetricsRange,
  IAdminRepository,
} from '../../domain/ports/IAdminRepository';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { MetricCard } from '@/shared/ui/components/metrics/MetricCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/components/ui/select';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Label } from '@/shared/ui/shadcn/components/ui/label';
import {
  Users,
  UserCheck,
  FileClock,
  UserCircle,
  Video,
  Activity,
  Wallet,
  Receipt,
  Percent,
  Banknote,
  CreditCard,
  Building2,
  Truck,
} from 'lucide-react';

const METRICS_RANGE_OPTIONS: { value: AdminDashboardMetricsRange; label: string }[] = [
  { value: 'all_time', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

function isValidCustomRange(from: string, to: string): boolean {
  if (!from || !to) return false;
  return new Date(from) <= new Date(to);
}

export default function AdminDashboardPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const [metricsRange, setMetricsRange] = useState<AdminDashboardMetricsRange>('all_time');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const isCustomWithDates = metricsRange === 'custom' && !!customFrom && !!customTo;
  const customRangeInvalid = isCustomWithDates && !isValidCustomRange(customFrom, customTo);

  const metricsParams =
    metricsRange === 'all_time'
      ? undefined
      : metricsRange === 'custom'
        ? { range: 'custom' as const, from: customFrom || undefined, to: customTo || undefined }
        : { range: metricsRange };

  const {
    data: overview,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErr,
  } = useQuery<AdminAnalyticsOverview>({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => repository.getAnalyticsOverview(),
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    error: metricsErr,
  } = useQuery<AdminDashboardMetrics>({
    queryKey: [
      'admin',
      'dashboard',
      'metrics',
      metricsRange,
      ...(metricsRange === 'custom' ? [customFrom, customTo] : []),
    ],
    queryFn: () => repository.getDashboardMetrics(metricsParams),
    enabled: (metricsRange !== 'custom' || isCustomWithDates) && !customRangeInvalid,
  });

  const isLoading = analyticsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="space-y-6">
          <div>
            <div className="h-6 w-32 bg-muted rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-8 w-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <div className="h-6 w-32 bg-muted rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 w-28 bg-muted rounded mb-2" />
                    <div className="h-8 w-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnalyticsError = analyticsError || !overview;
  const hasMetricsError = metricsError || !metrics;
  const showMetricsData =
    !hasMetricsError &&
    Boolean(metrics) &&
    (metricsRange !== 'custom' || (isCustomWithDates && !customRangeInvalid));

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {/* Analytics section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Analytics</h2>
        {hasAnalyticsError ? (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">
                {analyticsErr instanceof Error ? analyticsErr.message : 'Failed to load analytics overview.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Doctors', value: overview.totalDoctors, subtitle: 'Registered doctors', icon: Users, positive: true },
              { label: 'Verified Doctors', value: overview.verifiedDoctors, subtitle: 'KYC verified', icon: UserCheck, positive: true },
              { label: 'Pending KYC', value: overview.pendingKyc, subtitle: 'Awaiting verification', icon: FileClock, positive: overview.pendingKyc === 0 },
              { label: 'Total Patients', value: overview.totalPatients, subtitle: 'Registered patients', icon: UserCircle, positive: true },
              { label: 'Total Consultations', value: overview.totalConsultations, subtitle: 'All time', icon: Video, positive: true },
              { label: 'Active Consultations', value: overview.activeConsultations, subtitle: 'In progress', icon: Activity, positive: true },
            ].map((stat) => (
              <MetricCard
                key={stat.label}
                title={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                variant={stat.positive ? 'success' : 'danger'}
                appearance="soft"
              />
            ))}
          </div>
        )}
      </section>

      {/* Metrics section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">Metrics</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Range</span>
            <Select
              value={metricsRange}
              onValueChange={(v) => setMetricsRange(v as AdminDashboardMetricsRange)}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {METRICS_RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {metricsRange === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="metrics-date-from" className="sr-only">
                    From date
                  </Label>
                  <Input
                    id="metrics-date-from"
                    type="date"
                    className="h-9 w-[140px]"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    aria-invalid={customRangeInvalid}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="metrics-date-to" className="sr-only">
                    To date
                  </Label>
                  <Input
                    id="metrics-date-to"
                    type="date"
                    className="h-9 w-[140px]"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    aria-invalid={customRangeInvalid}
                  />
                </div>
                {customRangeInvalid && (
                  <span className="text-sm text-destructive" role="alert">
                    From must be before or equal to To
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {hasMetricsError ? (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">
                {metricsErr instanceof Error ? metricsErr.message : 'Failed to load dashboard metrics.'}
              </p>
            </CardContent>
          </Card>
        ) : metricsRange === 'custom' && (!isCustomWithDates || customRangeInvalid) ? (
          <Card className="border-muted">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">
                {!customFrom || !customTo
                  ? 'Select from and to dates to view metrics for the custom range.'
                  : 'From must be before or equal to To.'}
              </p>
            </CardContent>
          </Card>
        ) : metricsLoading && !metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 w-28 bg-muted rounded mb-2" />
                  <div className="h-8 w-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showMetricsData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Platform Balance',
                value: metrics.balances.totalPlatformBalance,
                subtitle: 'Platform balance',
                icon: Wallet,
              },
              {
                label: 'Total GST Collection',
                value: metrics.flows.totalGstCollection,
                subtitle: 'GST collected',
                icon: Receipt,
              },
              {
                label: 'Total Commission',
                value: metrics.flows.totalCommission,
                subtitle: 'Platform commission',
                icon: Percent,
              },
              {
                label: 'Total Doctors Balance',
                value: metrics.balances.totalDoctorsBalance,
                subtitle: 'Doctors wallet',
                icon: Banknote,
              },
              {
                label: 'Total Patients Balance',
                value: metrics.balances.totalPatientsBalance,
                subtitle: 'Patients wallet',
                icon: CreditCard,
              },
              {
                label: 'Total Razorpay Deposits',
                value: metrics.flows.totalRazorpayDeposits,
                subtitle: 'Razorpay deposits',
                icon: Building2,
              },
              {
                label: 'Total Payout Withdrawals',
                value: metrics.flows.totalPayoutWithdrawals,
                subtitle: 'Payouts withdrawn',
                icon: Truck,
              },
            ].map((stat) => (
              <MetricCard
                key={stat.label}
                title={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                variant="primary"
                appearance="soft"
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
