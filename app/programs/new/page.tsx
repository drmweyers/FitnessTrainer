/**
 * Create New Program Page
 */

'use client';

import { ProgramBuilder } from '@/components/programs/ProgramBuilder';
import { useRouter } from 'next/navigation';
import type { Program } from '@/types/program';

export default function NewProgramPage() {
  const router = useRouter();

  const handleSave = (program: Program) => {
    // TODO: Save via API
    console.log('Saving program:', program);
    router.push(`/programs/${program.id}`);
  };

  return (
    <div className="container py-8">
      <ProgramBuilder onSave={handleSave} onCancel={() => router.back()} />
    </div>
  );
}
