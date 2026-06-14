'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AdminGate from '@/components/admin/AdminGate';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminChallengers from '@/components/admin/AdminChallengers';
import AdminChallengerDetail from '@/components/admin/AdminChallengerDetail';

function ChallengersContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (id) return <AdminChallengerDetail id={id} />;
  return <AdminChallengers />;
}

export default function ChallengersPage() {
  return (
    <AdminGate>
      <AdminLayout>
        <Suspense>
          <ChallengersContent />
        </Suspense>
      </AdminLayout>
    </AdminGate>
  );
}
