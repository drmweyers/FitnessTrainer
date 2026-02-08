'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  User,
} from 'lucide-react';

interface Appointment {
  id: string;
  trainerId: string;
  clientId: string;
  title: string;
  description?: string;
  appointmentType: string;
  startDatetime: string;
  endDatetime: string;
  durationMinutes: number;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  status: string;
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
  trainer: { id: string; email: string; userProfile?: { bio?: string } };
  client: { id: string; email: string; userProfile?: { bio?: string } };
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-600 border-gray-300',
  cancelled: 'bg-red-100 text-red-600 border-red-300',
  no_show: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const TYPE_LABELS: Record<string, string> = {
  one_on_one: '1-on-1',
  group_class: 'Group',
  assessment: 'Assessment',
  consultation: 'Consultation',
  online_session: 'Online',
};

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 7 PM

export default function SchedulePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const weekDates = getWeekDates(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0] + 'T23:59:59';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `/api/schedule/appointments?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, weekDates[0].toISOString()]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getAppointmentsForDay = (date: Date): Appointment[] => {
    return appointments.filter((appt) => isSameDay(new Date(appt.startDatetime), date));
  };

  const getAppointmentPosition = (appt: Appointment) => {
    const start = new Date(appt.startDatetime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const top = (startHour - 6) * 60; // 60px per hour, starting from 6 AM
    const height = Math.max(appt.durationMinutes, 30);
    return { top, height };
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/schedule/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment({ ...selectedAppointment, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/schedule/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelReason: 'Cancelled by user' }),
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled' } : a
        )
      );
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    );
  }

  const today = new Date();

  return (
    <AppLayout breadcrumbItems={[{ label: 'Schedule', href: '/schedule' }]}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Schedule
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your appointments and availability
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'trainer' && (
              <a
                href="/schedule/availability"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Availability Settings
              </a>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Today
            </button>
            <button
              onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'week'
              ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'day' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'week' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {viewMode === 'week' ? (
            <>
              {/* Week header */}
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-2 text-xs text-gray-400 text-center border-r border-gray-200">
                  Time
                </div>
                {weekDates.map((date, i) => (
                  <div
                    key={i}
                    className={`p-2 text-center border-r border-gray-200 last:border-r-0 ${
                      isSameDay(date, today) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-xs text-gray-500">{dayNames[i]}</div>
                    <div
                      className={`text-sm font-medium mt-0.5 ${
                        isSameDay(date, today)
                          ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                          : 'text-gray-900'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="relative overflow-y-auto" style={{ maxHeight: '600px' }}>
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8" style={{ height: '60px' }}>
                    <div className="text-xs text-gray-400 text-right pr-2 pt-1 border-r border-gray-200">
                      {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                    </div>
                    {weekDates.map((date, dayIdx) => (
                      <div
                        key={dayIdx}
                        className="border-r border-b border-gray-100 last:border-r-0 relative"
                      />
                    ))}
                  </div>
                ))}

                {/* Appointment blocks overlay */}
                {weekDates.map((date, dayIdx) => {
                  const dayAppointments = getAppointmentsForDay(date);
                  return dayAppointments.map((appt) => {
                    const { top, height } = getAppointmentPosition(appt);
                    const statusColor = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
                    return (
                      <button
                        key={appt.id}
                        onClick={() => setSelectedAppointment(appt)}
                        className={`absolute rounded-md border px-1 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${statusColor}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${(dayIdx + 1) * 12.5}% + 2px)`,
                          width: 'calc(12.5% - 4px)',
                        }}
                        title={`${appt.title} - ${formatTime(appt.startDatetime)}`}
                      >
                        <div className="font-medium truncate">{appt.title}</div>
                        <div className="truncate">{formatTime(appt.startDatetime)}</div>
                      </button>
                    );
                  });
                })}
              </div>
            </>
          ) : (
            /* Day view */
            <>
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="text-sm font-medium text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="relative overflow-y-auto" style={{ maxHeight: '600px' }}>
                {HOURS.map((hour) => (
                  <div key={hour} className="flex" style={{ height: '60px' }}>
                    <div className="w-20 text-xs text-gray-400 text-right pr-2 pt-1 border-r border-gray-200 flex-shrink-0">
                      {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                    </div>
                    <div className="flex-1 border-b border-gray-100 relative" />
                  </div>
                ))}

                {/* Day appointments overlay */}
                {getAppointmentsForDay(currentDate).map((appt) => {
                  const { top, height } = getAppointmentPosition(appt);
                  const statusColor = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
                  return (
                    <button
                      key={appt.id}
                      onClick={() => setSelectedAppointment(appt)}
                      className={`absolute rounded-md border px-2 py-1 text-xs overflow-hidden cursor-pointer hover:opacity-90 ${statusColor}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '88px',
                        right: '8px',
                      }}
                    >
                      <div className="font-medium">{appt.title}</div>
                      <div>{formatTime(appt.startDatetime)} - {formatTime(appt.endDatetime)}</div>
                      <div className="truncate">{appt.client.email}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <span className={`inline-block w-3 h-3 rounded ${color.split(' ')[0]}`} />
              <span className="capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAppointment.title}
                  </h3>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      STATUS_COLORS[selectedAppointment.status]
                    }`}
                  >
                    {selectedAppointment.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(selectedAppointment.startDatetime)} -{' '}
                    {formatTime(selectedAppointment.endDatetime)}
                    {' '}({selectedAppointment.durationMinutes} min)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(selectedAppointment.startDatetime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>
                    {user?.role === 'trainer'
                      ? `Client: ${selectedAppointment.client.email}`
                      : `Trainer: ${selectedAppointment.trainer.email}`}
                  </span>
                </div>

                {selectedAppointment.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedAppointment.location}</span>
                  </div>
                )}

                {selectedAppointment.isOnline && selectedAppointment.meetingLink && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Video className="h-4 w-4" />
                    <a
                      href={selectedAppointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                    {TYPE_LABELS[selectedAppointment.appointmentType] || selectedAppointment.appointmentType}
                  </span>
                </div>

                {selectedAppointment.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-600">{selectedAppointment.description}</p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                    <p className="text-gray-600">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {selectedAppointment.status !== 'cancelled' &&
                selectedAppointment.status !== 'completed' && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                    {user?.role === 'trainer' && (
                      <div className="flex gap-2">
                        {selectedAppointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(selectedAppointment.id, 'no_show')}
                          className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                        >
                          No Show
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleCancel(selectedAppointment.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateForm && (
        <CreateAppointmentModal
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            fetchAppointments();
          }}
        />
      )}
    </AppLayout>
  );
}

// Create Appointment Modal Component
function CreateAppointmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    appointmentType: 'one_on_one',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    isOnline: false,
    meetingLink: '',
    notes: '',
  });
  const [clients, setClients] = useState<Array<{ id: string; email: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch trainer's clients
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/clients?status=active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          // Handle different response shapes
          const clientList = json.data?.clients || json.data || [];
          setClients(
            clientList.map((c: any) => ({
              id: c.clientId || c.id,
              email: c.client?.email || c.email || 'Unknown',
            }))
          );
        }
      } catch {
        // Clients API may not be available
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const startDatetime = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDatetime = new Date(`${formData.date}T${formData.endTime}:00`);

      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/schedule/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          title: formData.title,
          description: formData.description || undefined,
          appointmentType: formData.appointmentType,
          startDatetime: startDatetime.toISOString(),
          endDatetime: endDatetime.toISOString(),
          location: formData.location || undefined,
          isOnline: formData.isOnline,
          meetingLink: formData.meetingLink || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onCreated();
      } else {
        setError(json.error || 'Failed to create appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Appointment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Training Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="one_on_one">1-on-1 Training</option>
                <option value="group_class">Group Class</option>
                <option value="assessment">Assessment</option>
                <option value="consultation">Consultation</option>
                <option value="online_session">Online Session</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Gym, Studio, etc."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnline"
                checked={formData.isOnline}
                onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isOnline" className="text-sm text-gray-700">Online session</label>
            </div>

            {formData.isOnline && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
