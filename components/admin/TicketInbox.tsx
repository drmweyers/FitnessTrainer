'use client';

/**
 * TicketInbox - Admin component for viewing and managing support tickets
 *
 * Shows a table of all support tickets with status badges.
 * Clicking a ticket row expands it to show message and reply form.
 * Admin can update ticket status and add replies.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

interface TicketReply {
  message: string;
  adminId?: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
  user: {
    id: string;
    email: string;
    userProfile: { bio?: string; profilePhotoUrl?: string } | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

/**
 * TicketInbox component
 *
 * Admin-only inbox for managing user support tickets.
 */
export default function TicketInbox() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/support/tickets');
      if (!response.ok) throw new Error('Failed to load tickets');
      const data = await response.json();
      setTickets(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function updateTicket(
    id: string,
    payload: { status?: string; reply?: string }
  ) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      await fetchTickets();
      if (payload.reply) {
        setReplyText((prev) => ({ ...prev, [id]: '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-gray-500 text-sm">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-red-500 flex flex-col items-center gap-2">
          <AlertCircle size={24} />
          <p className="text-sm">Failed to load tickets: {error}</p>
          <button
            onClick={fetchTickets}
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
          <MessageSquare size={20} />
          Support Tickets
          {tickets.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({tickets.length})
            </span>
          )}
        </h2>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => {
              const isExpanded = expandedId === ticket.id;
              const isUpdating = updatingId === ticket.id;

              return (
                <div key={ticket.id} className="transition-colors">
                  {/* Ticket Row Header */}
                  <button
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{ticket.user.email}</span>
                        <span>·</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                        {ticket.replies.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{ticket.replies.length} repl{ticket.replies.length !== 1 ? 'ies' : 'y'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded Ticket Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      {/* Original Message */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2">User Message</p>
                        <p className="text-sm text-gray-700">{ticket.message}</p>
                      </div>

                      {/* Replies */}
                      {ticket.replies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500">Admin Replies</p>
                          {ticket.replies.map((reply, i) => (
                            <div
                              key={i}
                              className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                            >
                              <p className="text-sm text-gray-700">{reply.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ticket.status !== 'in_progress' && (
                          <button
                            onClick={() => updateTicket(ticket.id, { status: 'in_progress' })}
                            disabled={isUpdating}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Clock size={12} />
                            Mark In Progress
                          </button>
                        )}
                        {ticket.status !== 'resolved' && (
                          <button
                            onClick={() => updateTicket(ticket.id, { status: 'resolved' })}
                            disabled={isUpdating}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Resolve
                          </button>
                        )}
                        {ticket.status !== 'closed' && (
                          <button
                            onClick={() => updateTicket(ticket.id, { status: 'closed' })}
                            disabled={isUpdating}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={12} />
                            Close
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Send Reply
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={replyText[ticket.id] || ''}
                            onChange={(e) =>
                              setReplyText((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            placeholder="Type your reply..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() =>
                              updateTicket(ticket.id, {
                                reply: replyText[ticket.id] || '',
                              })
                            }
                            disabled={isUpdating || !replyText[ticket.id]?.trim()}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 self-end"
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
