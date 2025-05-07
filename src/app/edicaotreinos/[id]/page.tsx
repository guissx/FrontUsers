'use client';

import { use } from 'react';
import { Suspense } from 'react';
import EditarWorkout from '../../components/EditarWorkout';

// Função auxiliar para desempacotar a Promise
async function unpackParams(params: Promise<{ id: string }>) {
  return await params;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Desempacota a Promise usando React.use()
  const { id } = use(unpackParams(params));

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <EditarWorkout workoutId={id} />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';