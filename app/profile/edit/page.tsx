'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface Certification {
  id: string;
  certificationName: string;
  issuingOrganization: string;
  credentialId: string | null;
  issueDate: string | null;
  expiryDate: string | null;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const GENDERS = ['male', 'female', 'non-binary', 'prefer not to say'];

export default function ProfileEditPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Certifications state (trainers only)
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certForm, setCertForm] = useState({
    certificationName: '',
    issuingOrganization: '',
    credentialId: '',
    issueDate: '',
    expiryDate: '',
  });
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [isCertSaving, setIsCertSaving] = useState(false);

  const [form, setForm] = useState({
    bio: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    timezone: '',
    preferredUnits: 'metric',
    isPublic: true,
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      const token = localStorage.getItem('accessToken');
      fetch('/api/profiles/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data?.userProfile) {
            const p = result.data.userProfile;
            setForm({
              bio: p.bio || '',
              dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
              gender: p.gender || '',
              phone: p.phone || '',
              timezone: p.timezone || '',
              preferredUnits: p.preferredUnits || 'metric',
              isPublic: p.isPublic ?? true,
            });
          }
        })
        .catch(err => console.error('Failed to load profile:', err))
        .finally(() => setIsDataLoading(false));

      // Load certifications for trainers
      if (user.role === 'trainer') {
        loadCertifications();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const loadCertifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/profiles/certifications', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await res.json();
      if (result.success) {
        setCertifications(result.data);
      }
    } catch (err) {
      console.error('Failed to load certifications:', err);
    }
  };

  const handleCertSubmit = async () => {
    if (!certForm.certificationName || !certForm.issuingOrganization) return;
    setIsCertSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = editingCertId
        ? `/api/profiles/certifications/${editingCertId}`
        : '/api/profiles/certifications';
      const res = await fetch(url, {
        method: editingCertId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          certificationName: certForm.certificationName,
          issuingOrganization: certForm.issuingOrganization,
          credentialId: certForm.credentialId || null,
          issueDate: certForm.issueDate || null,
          expiryDate: certForm.expiryDate || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        await loadCertifications();
        setCertForm({ certificationName: '', issuingOrganization: '', credentialId: '', issueDate: '', expiryDate: '' });
        setEditingCertId(null);
        setMessage({ type: 'success', text: editingCertId ? 'Certification updated.' : 'Certification added.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save certification.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save certification.' });
    } finally {
      setIsCertSaving(false);
    }
  };

  const handleCertEdit = (cert: Certification) => {
    setEditingCertId(cert.id);
    setCertForm({
      certificationName: cert.certificationName,
      issuingOrganization: cert.issuingOrganization,
      credentialId: cert.credentialId || '',
      issueDate: cert.issueDate ? cert.issueDate.split('T')[0] : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : '',
    });
  };

  const handleCertDelete = async (id: string) => {
    if (!confirm('Delete this certification?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/profiles/certifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await res.json();
      if (result.success) {
        await loadCertifications();
        setMessage({ type: 'success', text: 'Certification deleted.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete certification.' });
    }
  };

  const handleCertCancel = () => {
    setEditingCertId(null);
    setCertForm({ certificationName: '', issuingOrganization: '', credentialId: '', issueDate: '', expiryDate: '' });
  };

  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="Edit Profile" subtitle="Update your profile information">
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
      title="Edit Profile"
      subtitle="Update your personal information and preferences"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile', href: '/profile' },
        { label: 'Edit' },
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

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  id="gender"
                  value={form.gender}
                  onValueChange={v => setForm(f => ({ ...f, gender: v }))}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map(g => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                value={form.timezone}
                onValueChange={v => setForm(f => ({ ...f, timezone: v }))}
              >
                <option value="">Select timezone</option>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Preferred Units</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferredUnits"
                    value="metric"
                    checked={form.preferredUnits === 'metric'}
                    onChange={() => setForm(f => ({ ...f, preferredUnits: 'metric' }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Metric (kg, cm)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferredUnits"
                    value="imperial"
                    checked={form.preferredUnits === 'imperial'}
                    onChange={() => setForm(f => ({ ...f, preferredUnits: 'imperial' }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Imperial (lbs, in)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Make profile public</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Public profiles can be viewed by trainers and other users.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Certifications (trainers only) */}
        {user?.role === 'trainer' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing certifications */}
              {certifications.length > 0 && (
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{cert.certificationName}</p>
                        <p className="text-xs text-gray-500">{cert.issuingOrganization}</p>
                        {cert.credentialId && (
                          <p className="text-xs text-gray-400">ID: {cert.credentialId}</p>
                        )}
                        <div className="flex space-x-3 text-xs text-gray-400 mt-1">
                          {cert.issueDate && <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>}
                          {cert.expiryDate && <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleCertEdit(cert)}>
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleCertDelete(cert.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit cert form */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {editingCertId ? 'Edit Certification' : 'Add Certification'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="certName">Certification Name *</Label>
                    <Input
                      id="certName"
                      value={certForm.certificationName}
                      onChange={e => setCertForm(f => ({ ...f, certificationName: e.target.value }))}
                      placeholder="e.g., NASM-CPT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certOrg">Issuing Organization *</Label>
                    <Input
                      id="certOrg"
                      value={certForm.issuingOrganization}
                      onChange={e => setCertForm(f => ({ ...f, issuingOrganization: e.target.value }))}
                      placeholder="e.g., NASM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credentialId">Credential ID</Label>
                    <Input
                      id="credentialId"
                      value={certForm.credentialId}
                      onChange={e => setCertForm(f => ({ ...f, credentialId: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certIssueDate">Issue Date</Label>
                    <Input
                      id="certIssueDate"
                      type="date"
                      value={certForm.issueDate}
                      onChange={e => setCertForm(f => ({ ...f, issueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="certExpiryDate">Expiry Date</Label>
                    <Input
                      id="certExpiryDate"
                      type="date"
                      value={certForm.expiryDate}
                      onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCertSaving || !certForm.certificationName || !certForm.issuingOrganization}
                    onClick={handleCertSubmit}
                  >
                    {isCertSaving ? 'Saving...' : editingCertId ? 'Update' : 'Add Certification'}
                  </Button>
                  {editingCertId && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCertCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
