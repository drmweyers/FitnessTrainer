'use client';

/**
 * ReportButton - Flag icon button that opens a report modal
 *
 * Allows authenticated users to report exercises, programs, or users
 * for inappropriate content, incorrect information, broken functionality, etc.
 */

import { useState } from 'react';
import { Flag, X, Send, Loader2, CheckCircle } from 'lucide-react';

type ContentType = 'exercise' | 'program' | 'user';
type ReportReason = 'inappropriate' | 'incorrect' | 'broken' | 'other';

interface ReportButtonProps {
  /** Type of content being reported */
  contentType: ContentType;
  /** ID of the content being reported */
  contentId: string;
}

const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate / Offensive',
  incorrect: 'Incorrect Information',
  broken: 'Broken / Not Working',
  other: 'Other',
};

/**
 * ReportButton component
 *
 * Renders a small flag icon button. On click, opens a modal with:
 * - Reason dropdown (inappropriate, incorrect, broken, other)
 * - Optional notes textarea
 * - Submit and Cancel buttons
 */
export default function ReportButton({ contentType, contentId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleOpen() {
    setIsOpen(true);
    setReason('inappropriate');
    setNotes('');
    setSubmitState('idle');
    setErrorMsg('');
  }

  function handleClose() {
    setIsOpen(false);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setSubmitState('idle');

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, reason, notes: notes || undefined }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitState('success');
    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Flag Button */}
      <button
        onClick={handleOpen}
        aria-label="Report this content"
        title="Report"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <Flag size={12} />
        <span>Report</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Flag size={16} className="text-red-500" />
                Report Content
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {submitState === 'success' ? (
                <div className="text-center py-4">
                  <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                  <p className="font-medium text-gray-900">Report Submitted</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Thank you. Our team will review this report.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {submitState === 'error' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      Failed to submit report: {errorMsg}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="report-reason"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="report-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value as ReportReason)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="report-notes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Additional Notes
                    </label>
                    <textarea
                      id="report-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional context (optional)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-lg transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
