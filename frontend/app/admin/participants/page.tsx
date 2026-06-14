'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AdminGate from '@/components/admin/AdminGate';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminParticipants from '@/components/admin/AdminParticipants';
import AdminParticipantDetail from '@/components/admin/AdminParticipantDetail';

function ParticipantsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (id) return <AdminParticipantDetail id={id} />;
  return <AdminParticipants />;
}

export default function ParticipantsPage() {
  return (
    <AdminGate>
      <AdminLayout>
        <Suspense>
          <ParticipantsContent />
        </Suspense>
      </AdminLayout>
    </AdminGate>
  );
}
