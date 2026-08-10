import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { isAdminSession } from '@/lib/server/rbac';

/**
 * Admin Environment — protected route.
 * The server checks the session carries `role === 'ADMIN'` BEFORE rendering
 * anything; unauthenticated users are redirected to the admin login. All
 * /api/admin/* routes enforce the same gate independently.
 */
export default function ConsentManagerAdminPage() {
  if (!isAdminSession()) {
    redirect('/admin/login');
  }

  return <AdminDashboard />;
}
