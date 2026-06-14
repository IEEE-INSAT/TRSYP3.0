import type { Metadata } from 'next';
import AdminGate from '@/components/admin/AdminGate';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard · TRSYP 3.0',
  description: 'TRSYP 3.0 Admin Dashboard',
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </AdminGate>
  );
}
