'use client';

/**
 * GroupClassForm - Form component for creating/editing group class appointments
 *
 * Extends the base appointment model with group class specific fields:
 * - Class name
 * - Max participants (default 10)
 * - Current participants count (read-only)
 * - Open for registration toggle
 */

import { useState } from 'react';
import { Users, Calendar, Plus, X, Loader2 } from 'lucide-react';

export interface GroupClassConfig {
  /** Display name for the group class */
  className: string;
  /** Maximum number of participants allowed */
  maxParticipants: number;
  /** Whether the class is currently accepting new registrations */
  isOpenForRegistration: boolean;
}

interface GroupClassFormProps {
  /** Called with the class config when the form is submitted */
  onSubmit: (config: GroupClassConfig) => void;
  /** Called when the user cancels the form */
  onCancel: () => void;
  /** Current number of registered participants (read-only display) */
  currentParticipants?: number;
  /** Initial values for editing an existing class */
  initialValues?: Partial<GroupClassConfig>;
}

interface FormErrors {
  className?: string;
  maxParticipants?: string;
}

/**
 * GroupClassForm component
 *
 * Renders a form for creating group fitness class appointments.
 */
export default function GroupClassForm({
  onSubmit,
  onCancel,
  currentParticipants,
  initialValues,
}: GroupClassFormProps) {
  const [className, setClassName] = useState(initialValues?.className || '');
  const [maxParticipants, setMaxParticipants] = useState(
    initialValues?.maxParticipants ?? 10
  );
  const [isOpenForRegistration, setIsOpenForRegistration] = useState(
    initialValues?.isOpenForRegistration ?? false
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!className.trim()) {
      newErrors.className = 'Class name is required';
    }

    if (maxParticipants < 1) {
      newErrors.maxParticipants = 'Must have at least 1 participant';
    }

    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    onSubmit({
      className: className.trim(),
      maxParticipants,
      isOpenForRegistration,
    });

    setIsSubmitting(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} />
          Group Class Details
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up your group fitness class with participant limits.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Class Name */}
        <div>
          <label
            htmlFor="class-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            id="class-name"
            type="text"
            value={className}
            onChange={(e) => {
              setClassName(e.target.value);
              if (errors.className) setErrors((prev) => ({ ...prev, className: undefined }));
            }}
            placeholder="e.g. Morning Yoga, HIIT Bootcamp"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.className ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.className && (
            <p className="mt-1 text-xs text-red-600">{errors.className}</p>
          )}
        </div>

        {/* Max Participants */}
        <div>
          <label
            htmlFor="max-participants"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Participants <span className="text-red-500">*</span>
          </label>
          <input
            id="max-participants"
            type="number"
            min={1}
            max={500}
            value={maxParticipants}
            onChange={(e) => {
              setMaxParticipants(parseInt(e.target.value, 10) || 0);
              if (errors.maxParticipants)
                setErrors((prev) => ({ ...prev, maxParticipants: undefined }));
            }}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxParticipants ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.maxParticipants && (
            <p className="mt-1 text-xs text-red-600">{errors.maxParticipants}</p>
          )}
        </div>

        {/* Current Participants (read-only) */}
        {currentParticipants !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Current Participants</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700 font-medium">{currentParticipants}</span>
              <span className="text-xs text-gray-500">registered</span>
            </div>
          </div>
        )}

        {/* Open for Registration Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="open-registration"
            type="checkbox"
            checked={isOpenForRegistration}
            onChange={(e) => setIsOpenForRegistration(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="open-registration" className="text-sm font-medium text-gray-700">
            Open for Registration
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={14} />
                Create Class
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
