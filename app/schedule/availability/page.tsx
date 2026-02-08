'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Clock, Save, Trash2, Plus, ArrowLeft } from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  location?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user?.role === 'client') {
      router.push('/schedule');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isAuthenticated) return;
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/schedule/availability', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setSlots(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch availability:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [isAuthenticated]);

  const getSlotsForDay = (dayOfWeek: number): AvailabilitySlot[] => {
    return slots.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  const addSlot = (dayOfWeek: number) => {
    setSlots([
      ...slots,
      {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    ]);
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...slots];
    (newSlots[index] as any)[field] = value;
    setSlots(newSlots);
  };

  const removeSlot = async (index: number) => {
    const slot = slots[index];
    if (slot.id) {
      // Delete from server
      try {
        const token = localStorage.getItem('accessToken');
        await fetch('/api/schedule/availability', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slotId: slot.id }),
        });
      } catch (err) {
        console.error('Failed to delete slot:', err);
      }
    }
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Validate
      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          setMessage({ type: 'error', text: `Invalid time range on ${DAY_NAMES[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}` });
          setSaving(false);
          return;
        }
      }

      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slots: slots.filter((s) => s.isAvailable).map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
            location: s.location,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Availability saved successfully!' });
        // Refresh to get server IDs
        const refreshRes = await fetch('/api/schedule/availability', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshJson = await refreshRes.json();
        if (refreshJson.success) {
          setSlots(refreshJson.data);
        }
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDayQuickSet = (dayOfWeek: number) => {
    const existing = getSlotsForDay(dayOfWeek);
    if (existing.length > 0) {
      // Remove all slots for this day
      setSlots(slots.filter((s) => s.dayOfWeek !== dayOfWeek));
    } else {
      // Add default 9-5 slot
      addSlot(dayOfWeek);
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbItems={[
        { label: 'Schedule', href: '/schedule' },
        { label: 'Availability', href: '/schedule/availability' },
      ]}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.push('/schedule')}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                Availability Settings
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-10">
              Set your weekly availability for client bookings
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Quick toggle bar */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick toggle days</p>
          <div className="flex gap-2">
            {DAY_SHORT.map((day, i) => {
              const hasSlots = getSlotsForDay(i).length > 0;
              return (
                <button
                  key={i}
                  onClick={() => toggleDayQuickSet(i)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    hasSlots
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day-by-day settings */}
        <div className="space-y-4">
          {DAY_NAMES.map((dayName, dayIdx) => {
            const daySlots = slots
              .map((slot, originalIndex) => ({ ...slot, originalIndex }))
              .filter((s) => s.dayOfWeek === dayIdx);

            return (
              <div
                key={dayIdx}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        daySlots.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900">{dayName}</span>
                    {daySlots.length === 0 && (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </div>
                  <button
                    onClick={() => addSlot(dayIdx)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus className="h-3 w-3" />
                    Add Slot
                  </button>
                </div>

                {daySlots.length > 0 && (
                  <div className="p-4 space-y-3">
                    {daySlots.map((slot) => (
                      <div key={slot.originalIndex} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateSlot(slot.originalIndex, 'startTime', e.target.value)
                          }
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateSlot(slot.originalIndex, 'endTime', e.target.value)
                          }
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Location (optional)"
                          value={slot.location || ''}
                          onChange={(e) =>
                            updateSlot(slot.originalIndex, 'location', e.target.value)
                          }
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeSlot(slot.originalIndex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
