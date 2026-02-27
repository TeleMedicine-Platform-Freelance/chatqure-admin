import type { ModuleRoute } from '@/core/router/types';
import { ADMIN_PATHS } from './paths';
import { lazy } from 'react';

const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminsPage = lazy(() => import('../pages/AdminsPage'));
const DoctorsPage = lazy(() => import('../pages/DoctorsPage'));
const PendingDoctorsPage = lazy(() => import('../pages/PendingDoctorsPage'));
const DoctorDetailsPage = lazy(() => import('../pages/DoctorDetailsPage'));
const PatientsPage = lazy(() => import('../pages/PatientsPage'));
const PatientDetailsPage = lazy(() => import('../pages/PatientDetailsPage'));
const BookingsPage = lazy(() => import('../pages/BookingsPage'));
const PayoutRequestsPage = lazy(() => import('../pages/PayoutRequestsPage'));
const PaymentsPage = lazy(() => import('../pages/PaymentsPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const SpecializationsPage = lazy(() => import('../pages/SpecializationsPage'));
const SymptomsPage = lazy(() => import('../pages/SymptomsPage'));
const SymptomCategoriesPage = lazy(() => import('../pages/SymptomCategoriesPage'));
const LanguagesPage = lazy(() => import('../pages/LanguagesPage'));
const MedicalConditionsPage = lazy(() => import('../pages/MedicalConditionsPage'));
const MedicalCouncilPage = lazy(() => import('../pages/MedicalCouncilPage'));
const MedicalApproachesPage = lazy(() => import('../pages/MedicalApproachesPage'));
const AddTestMoneyPage = lazy(() => import('../pages/AddTestMoneyPage'));

export const ADMIN_ROUTES: ModuleRoute[] = [
  {
    path: ADMIN_PATHS.DASHBOARD,
    module: 'admin',
    layout: 'app',
    title: 'Dashboard',
    component: AdminDashboardPage,
  },
  {
    path: ADMIN_PATHS.ADMINS,
    module: 'admin',
    layout: 'app',
    title: 'Admins',
    component: AdminsPage,
  },
  {
    path: ADMIN_PATHS.DOCTORS,
    module: 'admin',
    layout: 'app',
    title: 'Doctors',
    component: DoctorsPage,
  },
  {
    path: ADMIN_PATHS.DOCTOR_PENDING,
    module: 'admin',
    layout: 'app',
    title: 'Pending Doctors',
    component: PendingDoctorsPage,
  },
  {
    path: ADMIN_PATHS.DOCTOR_DETAILS,
    module: 'admin',
    layout: 'app',
    title: 'Doctor Details',
    component: DoctorDetailsPage,
  },
  {
    path: ADMIN_PATHS.PATIENTS,
    module: 'admin',
    layout: 'app',
    title: 'Patients',
    component: PatientsPage,
  },
  {
    path: ADMIN_PATHS.PATIENT_DETAILS,
    module: 'admin',
    layout: 'app',
    title: 'Patient Details',
    component: PatientDetailsPage,
  },
  {
    path: ADMIN_PATHS.BOOKINGS,
    module: 'admin',
    layout: 'app',
    title: 'Bookings',
    component: BookingsPage,
  },
  {
    path: ADMIN_PATHS.PAYOUTS,
    module: 'admin',
    layout: 'app',
    title: 'Payout Requests',
    component: PayoutRequestsPage,
  },
  {
    path: ADMIN_PATHS.PAYMENTS,
    module: 'admin',
    layout: 'app',
    title: 'Payments',
    component: PaymentsPage,
  },
  {
    path: ADMIN_PATHS.TRANSACTIONS,
    module: 'admin',
    layout: 'app',
    title: 'Transactions',
    component: TransactionsPage,
  },
  {
    path: ADMIN_PATHS.SPECIALIZATIONS,
    module: 'admin',
    layout: 'app',
    title: 'Specializations',
    component: SpecializationsPage,
  },
  {
    path: ADMIN_PATHS.SYMPTOMS,
    module: 'admin',
    layout: 'app',
    title: 'Symptoms',
    component: SymptomsPage,
  },
  {
    path: ADMIN_PATHS.SYMPTOM_CATEGORIES,
    module: 'admin',
    layout: 'app',
    title: 'Symptom Categories',
    component: SymptomCategoriesPage,
  },
  {
    path: ADMIN_PATHS.LANGUAGES,
    module: 'admin',
    layout: 'app',
    title: 'Languages',
    component: LanguagesPage,
  },
  {
    path: ADMIN_PATHS.MEDICAL_CONDITIONS,
    module: 'admin',
    layout: 'app',
    title: 'Medical Conditions',
    component: MedicalConditionsPage,
  },
  {
    path: ADMIN_PATHS.MEDICAL_COUNCIL,
    module: 'admin',
    layout: 'app',
    title: 'Medical Council',
    component: MedicalCouncilPage,
  },
  {
    path: ADMIN_PATHS.MEDICAL_APPROACHES,
    module: 'admin',
    layout: 'app',
    title: 'Medical Approaches',
    component: MedicalApproachesPage,
  },
  {
    path: ADMIN_PATHS.ADD_TEST_MONEY,
    module: 'admin',
    layout: 'app',
    title: 'Add Test Money',
    component: AddTestMoneyPage,
  },
];

export { ADMIN_PATHS } from './paths';
