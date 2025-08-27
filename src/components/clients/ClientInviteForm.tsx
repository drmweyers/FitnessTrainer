'use client';

import React, { useState } from 'react';
import { X, Mail, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Textarea } from '@/components/shared/Textarea';
import { InviteClientData } from '@/types/client';

interface ClientInviteFormProps {
  onSubmit: (data: InviteClientData) => Promise<void>;
  onCancel: () => void;
}

export default function ClientInviteForm({ onSubmit, onCancel }: ClientInviteFormProps) {
  const [formData, setFormData] = useState<InviteClientData>({
    clientEmail: '',
    customMessage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof InviteClientData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      if (!formData.clientEmail.trim()) {
        throw new Error('Email address is required');
      }
      
      if (!formData.clientEmail.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the invitation');
    } finally {
      setLoading(false);
    }
  };

  const defaultMessage = `Hi there!

I'd like to invite you to join me as your personal trainer through our fitness platform. This platform will help us:

• Track your workouts and progress
• Communicate easily about your fitness goals
• Schedule sessions and manage your program
• Monitor your achievements over time

Click the link below to accept this invitation and get started on your fitness journey!

Looking forward to working with you,
[Your Name]`;

  const finalMessage = formData.customMessage?.trim() || defaultMessage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Invite New Client
              </h2>
              <p className="text-blue-100 text-sm">
                Send a personalized invitation to join your training program
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!showPreview ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <Input
                  label="Client's Email Address *"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="client@example.com"
                  required
                  leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
                  className="text-lg"
                />
                <p className="mt-1 text-sm text-gray-600">
                  We'll send an invitation to this email address
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <Textarea
                  value={formData.customMessage}
                  onChange={(e) => handleInputChange('customMessage', e.target.value)}
                  placeholder="Add a personal touch to your invitation..."
                  rows={6}
                  maxLength={500}
                />
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>Leave blank to use our default message</span>
                  <span>{(formData.customMessage || '').length}/500</span>
                </div>
              </div>

              {/* Preview Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={!formData.clientEmail.trim()}
                  className="w-full sm:w-auto"
                >
                  Preview Invitation
                </Button>
              </div>
            </form>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Preview
                </h3>
                
                <div className="bg-white rounded border p-4 space-y-3">
                  <div className="text-sm text-gray-600 border-b pb-2">
                    <strong>To:</strong> {formData.clientEmail}<br />
                    <strong>Subject:</strong> Invitation to Join Your Personal Training Program
                  </div>
                  
                  <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {finalMessage}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                    <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded font-medium">
                      Accept Invitation
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      This button will be included in the actual email
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Edit Message
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={loading}
                  disabled={loading}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showPreview && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <p>💡 <strong>Tip:</strong> Personalized messages get better response rates!</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={loading}
                disabled={loading || !formData.clientEmail.trim()}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Send Invitation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}