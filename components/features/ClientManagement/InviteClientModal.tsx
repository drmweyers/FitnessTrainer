'use client';

import React, { useState } from 'react';
import { X, Mail, Send, UserPlus, Users, CheckCircle } from 'lucide-react';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, message?: string) => Promise<void>;
}

const InviteClientModal: React.FC<InviteClientModalProps> = ({
  isOpen,
  onClose,
  onInvite
}) => {
  const [formData, setFormData] = useState({
    email: '',
    customMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setFormData({ email: '', customMessage: '' });
    setStep('form');
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onInvite(formData.email, formData.customMessage || undefined);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const defaultMessage = `Hello!

I'd like to invite you to join my personal training program through EvoFit. This platform will help us work together more effectively by allowing us to:

• Create and track personalized workout programs
• Monitor your progress and achievements  
• Communicate easily about your fitness goals
• Schedule sessions and manage your training

I'm excited to work with you on your fitness journey. Click the invitation link to get started!

Best regards,
Your Personal Trainer`;

  if (!isOpen) return null;

  const finalMessage = formData.customMessage.trim() || defaultMessage;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {step === 'success' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <UserPlus className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {step === 'success' ? 'Invitation Sent!' : 'Invite New Client'}
              </h2>
              <p className="text-blue-100 text-sm">
                {step === 'success' 
                  ? 'Your invitation has been sent successfully'
                  : 'Send a personalized invitation to join your training program'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <X className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'form' && (
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (error) setError(null);
                    }}
                    placeholder="client@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We'll send an invitation to this email address
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Add a personal touch to your invitation..."
                  rows={6}
                  maxLength={500}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                />
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>Leave blank to use our default message</span>
                  <span>{formData.customMessage.length}/500</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Free for all trainers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('preview')}
                    disabled={!formData.email.trim() || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview & Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              {/* Email Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Preview
                </h3>
                
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
                  <div className="text-sm text-gray-600 border-b pb-2">
                    <strong>To:</strong> {formData.email}<br />
                    <strong>Subject:</strong> You're invited to join your personal training program on EvoFit
                  </div>
                  
                  <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {finalMessage}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                      Accept Invitation & Get Started
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      This button will be included in the actual email
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('form')}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Edit Message
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>{isLoading ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Invitation Sent Successfully!
                </h3>
                <p className="text-gray-600">
                  We've sent an invitation to <strong>{formData.email}</strong>. 
                  They'll receive an email with instructions on how to join your training program.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• The client receives an invitation email</li>
                  <li>• They can accept or decline the invitation</li>
                  <li>• Once accepted, they'll appear in your client list</li>
                  <li>• You can start creating programs and tracking their progress</li>
                </ul>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setStep('form');
                    setFormData({ email: '', customMessage: '' });
                  }}
                  className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Send Another Invitation
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteClientModal;