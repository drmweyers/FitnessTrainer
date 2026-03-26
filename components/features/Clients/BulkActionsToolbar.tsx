'use client';

import { useState } from 'react';

const CLIENT_STATUSES = ['active', 'inactive', 'onboarding', 'paused', 'archived'] as const;
type ClientStatus = (typeof CLIENT_STATUSES)[number];

interface BulkActionsToolbarProps {
  /** Number of currently selected clients */
  selectedCount: number;
  /** Called with the new status string when bulk status update is triggered */
  onUpdateStatus: (status: ClientStatus) => void;
  /** Called with the tag ID/name when bulk tag assignment is triggered */
  onAssignTag: (tag: string) => void;
  /** Called when the user wants to clear the current selection */
  onClearSelection: () => void;
}

/**
 * BulkActionsToolbar
 *
 * Appears when one or more clients are selected in the client list.
 * Provides controls to update status, assign a tag, or clear the selection.
 */
export default function BulkActionsToolbar({
  selectedCount,
  onUpdateStatus,
  onAssignTag,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState('');

  if (selectedCount === 0) return null;

  const handleStatusSelect = (status: ClientStatus) => {
    onUpdateStatus(status);
    setShowStatusMenu(false);
  };

  const handleApplyTag = () => {
    if (tagValue.trim()) {
      onAssignTag(tagValue.trim());
      setTagValue('');
      setShowTagInput(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      {/* Selection counter */}
      <span className="text-sm font-medium text-primary">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2 ml-2 relative">
        {/* Update Status */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowStatusMenu((prev) => !prev);
              setShowTagInput(false);
            }}
            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Update Status
          </button>

          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[140px]">
              {CLIENT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusSelect(status)}
                  className="block w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign Tag */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTagInput((prev) => !prev);
              setShowStatusMenu(false);
            }}
            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Assign Tag
          </button>

          {showTagInput && (
            <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[220px]">
              <input
                type="text"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                placeholder="Tag ID or name"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              />
              <button
                type="button"
                onClick={handleApplyTag}
                className="w-full px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto">
        <button
          type="button"
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
