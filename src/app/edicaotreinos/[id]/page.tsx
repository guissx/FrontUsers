'use client';
import EditarTreino from "@/app/components/EditarWorkout";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditarPage({ params }: PageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <EditarTreino workoutId={params.id} />
    </div>
  );
}