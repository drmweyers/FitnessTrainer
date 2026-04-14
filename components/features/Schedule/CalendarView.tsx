/**
 * CalendarView - Monthly and weekly appointment calendar
 *
 * Provides two view modes:
 * - Monthly: 5–6 week grid showing appointment dots per day, click to expand
 * - Weekly: 7-column grid showing appointments as time-positioned cards
 *
 * Fetches real appointments from /api/schedule/appointments for the visible range.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  subWeeks,
  isSameDay,
  isSameMonth,
  format,
  isToday,
} from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  trainerId: string;
  clientId: string;
  title: string;
  appointmentType: string;
  startDatetime: string;
  endDatetime: string;
  durationMinutes: number;
  status: string;
  trainer: { id: string; email: string };
  client: { id: string; email: string };
}

type CalendarViewMode = 'month' | 'week';

interface CalendarViewProps {
  /** Optional: pre-seeded appointments (skips initial fetch) */
  initialAppointments?: Appointment[];
  /** Called when user clicks an appointment chip/card */
  onAppointmentClick?: (_appointment: Appointment) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_DOT_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
  no_show: 'bg-yellow-500',
};

const STATUS_CARD_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 border-blue-300 text-blue-800',
  confirmed: 'bg-green-50 border-green-300 text-green-800',
  completed: 'bg-gray-50 border-gray-300 text-gray-600',
  cancelled: 'bg-red-50 border-red-300 text-red-700',
  no_show: 'bg-yellow-50 border-yellow-300 text-yellow-800',
};

const WEEK_HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM – 7 PM

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Build a flat array of Date objects covering the full calendar grid
 * for a given month (always starts on Sunday, ends on Saturday).
 */
function buildMonthGrid(anchorDate: Date): Date[] {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * Build an array of 7 Date objects for the week containing anchorDate.
 */
function buildWeekDates(anchorDate: Date): Date[] {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// ─── CalendarView Component ───────────────────────────────────────────────────

/**
 * Full-featured calendar with monthly and weekly view modes.
 * Fetches appointments from the existing schedule API and renders them
 * as colored chips (month view) or time-positioned cards (week view).
 */
export function CalendarView({ initialAppointments, onAppointmentClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments ?? []);
  const [loading, setLoading] = useState(!initialAppointments);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Derived date ranges
  const monthGrid = buildMonthGrid(currentDate);
  const weekDates = buildWeekDates(currentDate);

  // Fetch appointments covering the visible range
  const fetchAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      let rangeStart: Date;
      let rangeEnd: Date;

      if (viewMode === 'month') {
        rangeStart = monthGrid[0];
        rangeEnd = monthGrid[monthGrid.length - 1];
      } else {
        rangeStart = weekDates[0];
        rangeEnd = weekDates[6];
      }

      const startParam = format(rangeStart, 'yyyy-MM-dd');
      const endParam = format(rangeEnd, 'yyyy-MM-dd') + 'T23:59:59';

      const res = await fetch(
        `/api/schedule/appointments?startDate=${startParam}&endDate=${endParam}&limit=200`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAppointments(json.data);
      }
    } catch {
      // Silently degrade — calendar still renders without data
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goBack = () => {
    setSelectedDay(null);
    setCurrentDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const goForward = () => {
    setSelectedDay(null);
    setCurrentDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const goToToday = () => {
    setSelectedDay(null);
    setCurrentDate(new Date());
  };

  const switchMode = (mode: CalendarViewMode) => {
    setViewMode(mode);
    setSelectedDay(null);
  };

  // ── Data helpers ────────────────────────────────────────────────────────────

  /** Appointments on a specific date */
  const appointmentsForDay = (date: Date): Appointment[] =>
    appointments.filter((a) => isSameDay(new Date(a.startDatetime), date));

  /** CSS position for a week-view time-block */
  const getBlockStyle = (appt: Appointment): React.CSSProperties => {
    const start = new Date(appt.startDatetime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const top = (startHour - 6) * 60; // 60px per hour, grid starts at 6 AM
    const height = Math.max(appt.durationMinutes, 30);
    return { top: `${top}px`, height: `${height}px` };
  };

  // ── Header label ────────────────────────────────────────────────────────────

  const headerLabel =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : `${format(weekDates[0], 'MMM d')} – ${format(weekDates[6], 'MMM d, yyyy')}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-200">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            aria-label="Previous"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={goToToday}
            data-testid="calendar-today-btn"
            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Today
          </button>

          <button
            onClick={goForward}
            aria-label="Next"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>

          <h2
            data-testid="calendar-header-label"
            className="text-base font-semibold text-gray-900 ml-1 min-w-[160px]"
          >
            {headerLabel}
          </h2>
        </div>

        {/* View toggle */}
        <div
          data-testid="calendar-view-toggle"
          className="flex items-center gap-1 bg-gray-100 rounded-lg p-1"
        >
          <button
            onClick={() => switchMode('month')}
            data-testid="calendar-toggle-month"
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === 'month'
                ? 'bg-white font-medium shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => switchMode('week')}
            data-testid="calendar-toggle-week"
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === 'week'
                ? 'bg-white font-medium shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* ── Month view ── */}
      {!loading && viewMode === 'month' && (
        <MonthView
          grid={monthGrid}
          currentDate={currentDate}
          selectedDay={selectedDay}
          appointmentsForDay={appointmentsForDay}
          onDayClick={setSelectedDay}
          onAppointmentClick={onAppointmentClick}
        />
      )}

      {/* ── Week view ── */}
      {!loading && viewMode === 'week' && (
        <WeekView
          weekDates={weekDates}
          appointmentsForDay={appointmentsForDay}
          getBlockStyle={getBlockStyle}
          onAppointmentClick={onAppointmentClick}
        />
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  grid: Date[];
  currentDate: Date;
  selectedDay: Date | null;
  appointmentsForDay: (_d: Date) => Appointment[];
  onDayClick: (_d: Date) => void;
  onAppointmentClick?: (_a: Appointment) => void;
}

function MonthView({
  grid,
  currentDate,
  selectedDay,
  appointmentsForDay,
  onDayClick,
  onAppointmentClick,
}: MonthViewProps) {
  const selectedDayAppts = selectedDay ? appointmentsForDay(selectedDay) : [];

  return (
    <div>
      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES_SHORT.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div
        data-testid="calendar-month-grid"
        className="grid grid-cols-7"
      >
        {grid.map((date, idx) => {
          const dayAppts = appointmentsForDay(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;

          return (
            <button
              key={idx}
              onClick={() => onDayClick(date)}
              data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
              className={`min-h-[80px] p-1.5 text-left border-b border-r border-gray-100 transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-end mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-300'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Appointment dots (up to 3 visible) */}
              <div className="flex flex-col gap-0.5">
                {dayAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(appt);
                    }}
                    className={`text-xs px-1 py-0.5 rounded truncate leading-tight cursor-pointer hover:opacity-80 ${
                      STATUS_CARD_COLORS[appt.status] ?? STATUS_CARD_COLORS.scheduled
                    }`}
                    title={`${formatTime(appt.startDatetime)} — ${appt.title}`}
                  >
                    {formatTime(appt.startDatetime)} {appt.title}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div
          data-testid="calendar-day-detail-panel"
          className="border-t border-gray-200 p-4"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {format(selectedDay, 'EEEE, MMMM d')}
          </h3>
          {selectedDayAppts.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments this day.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedDayAppts.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onClick={onAppointmentClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
  weekDates: Date[];
  appointmentsForDay: (_d: Date) => Appointment[];
  getBlockStyle: (_a: Appointment) => React.CSSProperties;
  onAppointmentClick?: (_a: Appointment) => void;
}

function WeekView({ weekDates, appointmentsForDay, getBlockStyle, onAppointmentClick }: WeekViewProps) {
  return (
    <div data-testid="calendar-week-grid">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-2 text-xs text-gray-400 text-center border-r border-gray-100">
          Time
        </div>
        {weekDates.map((date, i) => (
          <div
            key={i}
            data-testid={`calendar-week-day-${DAY_NAMES_SHORT[i].toLowerCase()}`}
            className={`p-2 text-center border-r border-gray-100 last:border-r-0 ${
              isToday(date) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-xs text-gray-500 uppercase">
              {DAY_NAMES_SHORT[i]}
            </div>
            <div
              className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                isToday(date)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-900'
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid + appointment blocks */}
      <div className="relative overflow-y-auto" style={{ maxHeight: '560px' }}>
        {/* Hour rows */}
        {WEEK_HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8" style={{ height: '60px' }}>
            <div className="text-xs text-gray-400 text-right pr-2 pt-1 border-r border-gray-100 flex-shrink-0">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            {weekDates.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className="border-r border-b border-gray-100 last:border-r-0"
              />
            ))}
          </div>
        ))}

        {/* Appointment blocks overlay */}
        {weekDates.map((date, dayIdx) =>
          appointmentsForDay(date).map((appt) => (
            <button
              key={appt.id}
              onClick={() => onAppointmentClick?.(appt)}
              data-testid={`calendar-appt-block-${appt.id}`}
              className={`absolute rounded-lg border px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity text-left ${
                STATUS_CARD_COLORS[appt.status] ?? STATUS_CARD_COLORS.scheduled
              }`}
              style={{
                ...getBlockStyle(appt),
                left: `calc(${(dayIdx + 1) * 12.5}% + 2px)`,
                width: 'calc(12.5% - 4px)',
              }}
              title={`${appt.title} — ${formatTime(appt.startDatetime)}`}
            >
              <div className="font-semibold truncate leading-tight">{appt.title}</div>
              <div className="truncate opacity-80">{formatTime(appt.startDatetime)}</div>
            </button>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-100">
        {Object.entries(STATUS_DOT_COLORS).map(([status, dotColor]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (_a: Appointment) => void;
}

/**
 * Compact card used in the month-view day-detail panel.
 */
function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <button
      onClick={() => onClick?.(appointment)}
      className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-90 ${
        STATUS_CARD_COLORS[appointment.status] ?? STATUS_CARD_COLORS.scheduled
      }`}
    >
      <div className="font-semibold truncate">{appointment.title}</div>
      <div className="flex items-center gap-3 mt-1 text-xs opacity-80">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(appointment.startDatetime)} – {formatTime(appointment.endDatetime)}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {appointment.client.email}
        </span>
      </div>
    </button>
  );
}
