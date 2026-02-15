'use client';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { RefreshCw } from 'lucide-react';

export default function UpdateAvailable() {
  const { updateAvailable, skipWaiting } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">New version available</h3>
          <p className="text-xs opacity-90">
            A new version of EvoFit is ready to use
          </p>
        </div>
        <button
          onClick={skipWaiting}
          className="bg-white text-green-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
