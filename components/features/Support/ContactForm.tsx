'use client';

/**
 * ContactForm - User-facing support ticket submission form
 *
 * Allows any authenticated user to submit a support ticket.
 * Validates subject and message fields before submission.
 */

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';

interface FormData {
  subject: string;
  message: string;
}

interface FormErrors {
  subject?: string;
  message?: string;
}

/**
 * ContactForm component
 *
 * Renders a support ticket submission form with client-side validation.
 */
export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ subject: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    setSubmitState('idle');

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setSubmitState('success');
      setFormData({ subject: '', message: '' });
    } catch (err) {
      setSubmitState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setIsLoading(false);
    }
  }

  if (submitState === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Submitted!</h3>
        <p className="text-gray-600 mb-4">
          Your support ticket has been received. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitState('idle')}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} />
          Contact Support
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          We typically respond within 24 hours.
        </p>
      </div>

      {submitState === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">Failed to submit ticket: {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, subject: e.target.value }));
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
            }}
            placeholder="Brief description of your issue"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            rows={5}
            value={formData.message}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, message: e.target.value }));
              if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
            }}
            placeholder="Describe your issue in detail..."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-600">{errors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
}
