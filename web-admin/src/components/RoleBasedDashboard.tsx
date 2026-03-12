'use client';

import { useRole } from '../contexts/RoleContext';

import { AdminDashboard } from './dashboards/AdminDashboard';
import { CompanyOwnerDashboard } from './dashboards/CompanyOwnerDashboard';
import { CustomerDashboard } from './dashboards/CustomerDashboard';
import { ErrorDashboard } from './dashboards/ErrorDashboard';
import { LoadingDashboard } from './dashboards/LoadingDashboard';
import { UnregisteredDashboard } from './dashboards/UnregisteredDashboard';

export function RoleBasedDashboard() {
  const { roleInfo, isLoading } = useRole();

  if (isLoading) {
    return <LoadingDashboard />;
  }

  switch (roleInfo.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'company_owner':
      return (
        <CompanyOwnerDashboard
          companyId={roleInfo.companyId}
          companyName={roleInfo.companyName}
        />
      );
    case 'customer':
      return <CustomerDashboard />;
    case 'unregistered':
      return <UnregisteredDashboard />;
    case 'error':
      return <ErrorDashboard error={roleInfo.error} />;
    default:
      return <UnregisteredDashboard />;
  }
}
