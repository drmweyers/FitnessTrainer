'use client';

import { useState } from 'react';

interface ClientProfileData {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  goals?: string;
  limitations?: string;
  notes?: string;
}

interface ClientProfileEditorProps {
  /** The ID of the client being edited */
  clientId: string;
  /** Pre-filled data for the form fields */
  initialData: ClientProfileData;
  /** Called after a successful save. Receives the updated profile data. */
  onSave: (updatedData: ClientProfileData) => void;
  /** Called when the user cancels editing */
  onCancel: () => void;
}

/**
 * ClientProfileEditor
 *
 * Inline edit form for the editable fields of a client's profile:
 * emergency contact, goals, limitations/injuries, and trainer notes.
 */
export default function ClientProfileEditor({
  clientId,
  initialData,
  onSave,
  onCancel,
}: ClientProfileEditorProps) {
  const [formData, setFormData] = useState<ClientProfileData>({
    emergencyContactName: initialData.emergencyContactName ?? '',
    emergencyContactPhone: initialData.emergencyContactPhone ?? '',
    goals: initialData.goals ?? '',
    limitations: initialData.limitations ?? '',
    notes: initialData.notes ?? '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ClientProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save profile');
        return;
      }

      onSave(formData);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Emergency Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="emergencyContactName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Emergency Contact Name
          </label>
          <input
            id="emergencyContactName"
            type="text"
            value={formData.emergencyContactName}
            onChange={handleChange('emergencyContactName')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Full name"
          />
        </div>

        <div>
          <label
            htmlFor="emergencyContactPhone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Emergency Contact Phone
          </label>
          <input
            id="emergencyContactPhone"
            type="tel"
            value={formData.emergencyContactPhone}
            onChange={handleChange('emergencyContactPhone')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Phone number"
          />
        </div>
      </div>

      {/* Goals */}
      <div>
        <label
          htmlFor="goals"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Goals
        </label>
        <textarea
          id="goals"
          value={formData.goals}
          onChange={handleChange('goals')}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Client fitness goals..."
        />
      </div>

      {/* Limitations / Injuries */}
      <div>
        <label
          htmlFor="limitations"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Limitations / Injuries
        </label>
        <textarea
          id="limitations"
          value={formData.limitations}
          onChange={handleChange('limitations')}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Physical limitations or injury history..."
        />
      </div>

      {/* Trainer Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={handleChange('notes')}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Private trainer notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
