'use client';

/**
 * ContentReports - Admin component for reviewing and resolving content reports
 *
 * Shows a table of all flagged content reports.
 * Admin can resolve or dismiss reports.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface ContentReport {
  id: string;
  reporterId: string;
  contentType: 'exercise' | 'program' | 'user';
  contentId: string;
  reason: string;
  notes: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    email: string;
  };
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  exercise: 'bg-purple-100 text-purple-700',
  program: 'bg-blue-100 text-blue-700',
  user: 'bg-orange-100 text-orange-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-700',
};

/**
 * ContentReports component
 *
 * Admin-only view for reviewing reported content across the platform.
 */
export default function ContentReports() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to load reports');
      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!response.ok) throw new Error('Failed to resolve report');

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'resolved' as const } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report');
    } finally {
      setResolvingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Content Reports</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-gray-500 text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Content Reports</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-red-500 flex flex-col items-center gap-2">
          <AlertCircle size={24} />
          <p className="text-sm">Failed to load reports: {error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Flag size={20} />
          Content Reports
          {reports.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({reports.length})
            </span>
          )}
        </h2>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Flag size={32} className="mx-auto mb-2 opacity-50" />
            <p>No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Reporter</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Content Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{report.reporter.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          CONTENT_TYPE_COLORS[report.contentType] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {report.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{report.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(report.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {report.status === 'pending' || report.status === 'reviewing' ? (
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={resolvingId === report.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                          >
                            {resolvingId === report.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                          </span>
                        )}
                        {report.notes && (
                          <button
                            title={report.notes}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
