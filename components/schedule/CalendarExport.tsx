'use client';

import { useState, useRef } from 'react';
import { Download, Link, X, ChevronDown, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { tokenUtils } from '@/lib/api/auth';

function generateFeedTokenClient(userId: string): string {
  // Simple hash for client-side token generation
  // This must match the server-side generateFeedToken logic
  // We call the API to get the token instead
  return userId;
}

export function CalendarExport() {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDownloadICS = async () => {
    setDropdownOpen(false);
    try {
      const tokens = tokenUtils.getTokens();
      const response = await fetch('/api/schedule/export/ics', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evofit-schedule.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ICS:', err);
    }
  };

  const handleSubscribe = async () => {
    setDropdownOpen(false);
    if (user?.id) {
      // Fetch the feed token from the server
      try {
        const tokens = tokenUtils.getTokens();
        const response = await fetch('/api/schedule/feed-token', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          const baseUrl = window.location.origin;
          setFeedUrl(`${baseUrl}/api/schedule/feed/${data.token}`);
        } else {
          // Fallback: generate a placeholder URL
          const baseUrl = window.location.origin;
          setFeedUrl(`${baseUrl}/api/schedule/feed/your-feed-token`);
        }
      } catch {
        const baseUrl = window.location.origin;
        setFeedUrl(`${baseUrl}/api/schedule/feed/your-feed-token`);
      }
    }
    setModalOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.querySelector<HTMLInputElement>('[data-feed-url]');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          aria-label="Export to Calendar"
        >
          <Download className="h-4 w-4" />
          Export to Calendar
          <ChevronDown className="h-3 w-3" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
            >
              <Download className="h-4 w-4" />
              Download .ics
            </button>
            <button
              onClick={handleSubscribe}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
            >
              <Link className="h-4 w-4" />
              Subscribe to Feed
            </button>
          </div>
        )}
      </div>

      {/* Subscribe Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subscribe to Calendar Feed</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Copy this URL and add it to your calendar app to automatically sync your EvoFit schedule.
              </p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={feedUrl}
                  data-feed-url
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 truncate"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">How to subscribe:</h4>

                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Google Calendar:</span>{' '}
                    Settings &gt; Add calendar &gt; From URL &gt; paste the link
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Apple Calendar:</span>{' '}
                    File &gt; New Calendar Subscription &gt; paste the link
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Outlook:</span>{' '}
                    Add calendar &gt; Subscribe from web &gt; paste the link
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
