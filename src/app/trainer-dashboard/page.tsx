'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';
import TrainerProgressDashboard from '@/components/features/TrainerDashboard/TrainerProgressDashboard';

export default function TrainerDashboardPage() {
  const trainerId = 'trainer-1'; // In real app, get from authentication

  return (
    <Layout>
      <div className="p-6">
        <TrainerProgressDashboard trainerId={trainerId} />
      </div>
    </Layout>
  );
}