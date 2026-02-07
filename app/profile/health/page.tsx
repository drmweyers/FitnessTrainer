'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function HealthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    bloodType: '',
    medicalConditions: '',
    medications: '',
    allergies: '',
    injuries: '',
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      const token = localStorage.getItem('accessToken');
      fetch('/api/profiles/health', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            const h = result.data;
            setForm({
              bloodType: h.bloodType || '',
              medicalConditions: (h.medicalConditions || []).join('\n'),
              medications: (h.medications || []).join('\n'),
              allergies: (h.allergies || []).join('\n'),
              injuries: h.injuries ? JSON.stringify(h.injuries, null, 2) : '',
            });
          }
        })
        .catch(err => console.error('Failed to load health data:', err))
        .finally(() => setIsDataLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const toArray = (val: string) =>
      val
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    let injuries = null;
    if (form.injuries.trim()) {
      try {
        injuries = JSON.parse(form.injuries);
      } catch {
        // If not valid JSON, store as a simple array
        injuries = toArray(form.injuries);
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/profiles/health', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          bloodType: form.bloodType || null,
          medicalConditions: toArray(form.medicalConditions),
          medications: toArray(form.medications),
          allergies: toArray(form.allergies),
          injuries,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Health information updated successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update health data.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update health data.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="Health Questionnaire" subtitle="Manage your health information">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Health Questionnaire"
      subtitle="Your health information helps trainers create safe programs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile', href: '/profile' },
        { label: 'Health' },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select
                id="bloodType"
                value={form.bloodType}
                onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map(bt => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="medicalConditions">Medical Conditions</Label>
              <Textarea
                id="medicalConditions"
                value={form.medicalConditions}
                onChange={e => setForm(f => ({ ...f, medicalConditions: e.target.value }))}
                placeholder="Enter each condition on a new line..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">One condition per line</p>
            </div>

            <div>
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                value={form.medications}
                onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
                placeholder="Enter each medication on a new line..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">One medication per line</p>
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={form.allergies}
                onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                placeholder="Enter each allergy on a new line..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">One allergy per line</p>
            </div>

            <div>
              <Label htmlFor="injuries">Current or Past Injuries</Label>
              <Textarea
                id="injuries"
                value={form.injuries}
                onChange={e => setForm(f => ({ ...f, injuries: e.target.value }))}
                placeholder="Describe any injuries, one per line..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                List injuries one per line, or provide details as needed
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Health Info'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
