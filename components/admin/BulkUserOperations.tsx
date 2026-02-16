'use client';

import { useState } from 'react';
import { CheckSquare, UserX, UserCheck, Trash2 } from 'lucide-react';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface BulkUserOperationsProps {
  selectedUsers: Set<string>;
  users: UserListItem[];
  onOperationComplete?: () => void;
}

export function BulkUserOperations({
  selectedUsers,
  users,
  onOperationComplete,
}: BulkUserOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<'suspend' | 'activate' | null>(null);

  const selectedCount = selectedUsers.size;
  const selectedUsersList = users.filter((u) => selectedUsers.has(u.id));

  const handleOperation = async (operation: 'suspend' | 'activate') => {
    setPendingOperation(operation);
    setShowConfirmDialog(true);
  };

  const confirmOperation = async () => {
    if (!pendingOperation) return;

    setIsProcessing(true);
    setShowConfirmDialog(false);

    try {
      // In production, this would call the API endpoint
      // For now, just simulate the operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`${pendingOperation} operation for users:`, Array.from(selectedUsers));

      onOperationComplete?.();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsProcessing(false);
      setPendingOperation(null);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOperation('suspend')}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <UserX size={16} />
              Suspend Selected
            </button>

            <button
              onClick={() => handleOperation('activate')}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <UserCheck size={16} />
              Activate Selected
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingOperation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className={`
              mb-4 p-3 rounded-lg
              ${pendingOperation === 'suspend' ? 'bg-red-50' : 'bg-green-50'}
            `}>
              {pendingOperation === 'suspend' ? (
                <UserX className="text-red-600" size={24} />
              ) : (
                <UserCheck className="text-green-600" size={24} />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {pendingOperation === 'suspend' ? 'Suspend Users' : 'Activate Users'}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to {pendingOperation} the following {selectedCount} user{selectedCount > 1 ? 's' : ''}?
            </p>

            <div className="max-h-48 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              {selectedUsersList.map((user) => (
                <div key={user.id} className="flex items-center gap-2 text-sm">
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'trainer' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'}
                  `}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingOperation(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmOperation}
                className={`
                  flex-1 px-4 py-2 text-white rounded-lg transition-colors
                  ${pendingOperation === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'}
                `}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
