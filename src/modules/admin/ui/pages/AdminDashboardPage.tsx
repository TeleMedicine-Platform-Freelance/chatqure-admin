import { useQuery } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { MetricCard } from '@/shared/ui/components/metrics/MetricCard';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);

  const { data: overview, isLoading: analyticsLoading, isError: analyticsError, error: analyticsErr } = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => repository.getAnalyticsOverview(),
  });

  const { data: metrics, isLoading: metricsLoading, isError: metricsError, error: metricsErr } = useQuery({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: () => repository.getDashboardMetrics(),
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
          <>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0">
                  {[
                    { label: 'Total Doctors', value: overview.totalDoctors, positive: true, change: '—' },
                    { label: 'Verified Doctors', value: overview.verifiedDoctors, positive: true, change: '—' },
                    { label: 'Pending KYC', value: overview.pendingKyc, positive: overview.pendingKyc === 0, change: '—' },
                    { label: 'Total Patients', value: overview.totalPatients, positive: true, change: '—' },
                  ].map((stat) => (
                    <div key={stat.label} className="px-4 py-3 first:pl-0 last:pr-0 sm:first:pt-0 sm:last:pb-0">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <Badge variant={stat.positive ? 'default' : 'destructive'}>{stat.change}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
          </>
        )}
      </section>

      {/* Metrics section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Metrics</h2>
        {hasMetricsError ? (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">
                {metricsErr instanceof Error ? metricsErr.message : 'Failed to load dashboard metrics.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Platform Balance', value: metrics.totalPlatformBalance, subtitle: 'Platform balance', icon: Wallet },
              { label: 'Total GST Collection', value: metrics.totalGstCollection, subtitle: 'GST collected', icon: Receipt },
              { label: 'Total Commission', value: metrics.totalCommission, subtitle: 'Platform commission', icon: Percent },
              { label: 'Total Doctors Balance', value: metrics.totalDoctorsBalance, subtitle: 'Doctors wallet', icon: Banknote },
              { label: 'Total Patients Balance', value: metrics.totalPatientsBalance, subtitle: 'Patients wallet', icon: CreditCard },
              { label: 'Total Razorpay Deposits', value: metrics.totalRazorpayDeposits, subtitle: 'Razorpay deposits', icon: Building2 },
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
        )}
      </section>
    </div>
  );
}
