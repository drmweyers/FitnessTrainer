'use client';
import React, { useState } from 'react';

interface WhatsAppSetupProps {
  currentNumber?: string;
  onSave: (number: string) => Promise<void>;
}

export default function WhatsAppSetup({ currentNumber, onSave }: WhatsAppSetupProps) {
  const [number, setNumber] = useState(currentNumber || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string) => {
    // International format: + followed by 7-15 digits
    return /^\+\d{7,15}$/.test(phone.replace(/[\s-]/g, ''));
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);

    if (!number.trim()) {
      // Allow clearing the number
      setSaving(true);
      try {
        await onSave('');
        setSaved(true);
      } catch {
        setError('Failed to save');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!validatePhone(number)) {
      setError('Please enter a valid international phone number (e.g., +1234567890)');
      return;
    }

    setSaving(true);
    try {
      await onSave(number.replace(/[\s-]/g, ''));
      setSaved(true);
    } catch {
      setError('Failed to save WhatsApp number');
    } finally {
      setSaving(false);
    }
  };

  const cleanNumber = number.replace(/[^\d+]/g, '').replace(/^\+/, '');
  const previewUrl = cleanNumber ? `wa.me/${cleanNumber}` : '';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h3>
          <p className="text-sm text-gray-500">Let clients message you directly via WhatsApp</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="whatsapp-number" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number
          </label>
          <input
            id="whatsapp-number"
            type="tel"
            placeholder="+1234567890"
            value={number}
            onChange={e => { setNumber(e.target.value); setSaved(false); setError(''); }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            International format with country code (e.g., +1 for US, +44 for UK)
          </p>
        </div>

        {previewUrl && (
          <div className="bg-gray-50 rounded-md px-3 py-2">
            <p className="text-xs text-gray-500">Preview link:</p>
            <p className="text-sm text-blue-600 font-mono">{previewUrl}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        {saved && (
          <p className="text-sm text-green-600" role="status">WhatsApp number saved successfully!</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save WhatsApp Number'}
        </button>
      </div>
    </div>
  );
}
