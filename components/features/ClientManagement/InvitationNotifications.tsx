'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  User, 
  Mail, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  UserCheck,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface TrainerInvitation {
  id: string;
  trainerId: string;
  clientEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  customMessage?: string;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
  trainer: {
    id: string;
    email: string;
    userProfile?: {
      bio?: string;
    };
    trainerCertifications?: Array<{
      certificationName: string;
      issuingOrganization: string;
    }>;
    trainerSpecializations?: Array<{
      specialization: string;
      yearsExperience?: number;
    }>;
  };
}

interface InvitationNotificationsProps {
  clientEmail: string;
  onAcceptInvitation: (token: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
}

const InvitationNotifications: React.FC<InvitationNotificationsProps> = ({
  clientEmail,
  onAcceptInvitation,
  onDeclineInvitation
}) => {
  const [invitations, setInvitations] = useState<TrainerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvitation, setExpandedInvitation] = useState<string | null>(null);
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockInvitations: TrainerInvitation[] = [
      {
        id: '1',
        trainerId: 't1',
        clientEmail: clientEmail,
        token: 'token123',
        status: 'pending',
        customMessage: 'Hi! I\'d love to help you reach your fitness goals. I specialize in strength training and have helped many clients achieve amazing results.',
        sentAt: '2024-01-20T10:00:00Z',
        expiresAt: '2024-02-20T10:00:00Z',
        trainer: {
          id: 't1',
          email: 'john.trainer@fitpro.com',
          userProfile: { bio: 'John Smith - Certified Personal Trainer' },
          trainerCertifications: [
            { certificationName: 'NASM-CPT', issuingOrganization: 'National Academy of Sports Medicine' },
            { certificationName: 'Precision Nutrition L1', issuingOrganization: 'Precision Nutrition' }
          ],
          trainerSpecializations: [
            { specialization: 'Strength Training', yearsExperience: 5 },
            { specialization: 'Weight Loss', yearsExperience: 3 }
          ]
        }
      },
      {
        id: '2',
        trainerId: 't2',
        clientEmail: clientEmail,
        token: 'token456',
        status: 'pending',
        sentAt: '2024-01-19T14:30:00Z',
        expiresAt: '2024-02-19T14:30:00Z',
        trainer: {
          id: 't2',
          email: 'sarah.fitness@example.com',
          userProfile: { bio: 'Sarah Johnson - Fitness Coach' },
          trainerCertifications: [
            { certificationName: 'ACE-CPT', issuingOrganization: 'American Council on Exercise' }
          ],
          trainerSpecializations: [
            { specialization: 'HIIT Training', yearsExperience: 4 },
            { specialization: 'Nutrition Coaching', yearsExperience: 2 }
          ]
        }
      }
    ];

    setTimeout(() => {
      setInvitations(mockInvitations);
      setLoading(false);
    }, 1000);
  }, [clientEmail]);

  const handleAccept = async (invitation: TrainerInvitation) => {
    setProcessingInvitations(prev => new Set(prev).add(invitation.id));
    setError(null);

    try {
      await onAcceptInvitation(invitation.token);
      // Remove invitation from list after acceptance
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitation.id);
        return newSet;
      });
    }
  };

  const handleDecline = async (invitation: TrainerInvitation) => {
    setProcessingInvitations(prev => new Set(prev).add(invitation.id));
    setError(null);

    try {
      await onDeclineInvitation(invitation.id);
      // Remove invitation from list after declining
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitation.id);
        return newSet;
      });
    }
  };

  const getTrainerName = (trainer: TrainerInvitation['trainer']) => {
    return trainer.userProfile?.bio || trainer.email.split('@')[0] || 'Trainer';
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Expired';
    if (diffInHours < 24) return `${diffInHours} hours remaining`;
    return `${Math.floor(diffInHours / 24)} days remaining`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expiresAt));

  if (pendingInvitations.length === 0) {
    return null; // Don't show the component if there are no pending invitations
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Trainer Invitations ({pendingInvitations.length})
            </h2>
            <p className="text-sm text-gray-600">
              You have pending invitations from personal trainers
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="divide-y divide-gray-200">
        {pendingInvitations.map((invitation) => {
          const isProcessing = processingInvitations.has(invitation.id);
          const isExpanded = expandedInvitation === invitation.id;
          const trainerName = getTrainerName(invitation.trainer);

          return (
            <div key={invitation.id} className="p-6">
              {/* Main Invitation Content */}
              <div className="flex items-start space-x-4">
                {/* Trainer Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {trainerName.charAt(0).toUpperCase()}
                </div>

                {/* Invitation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {trainerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {invitation.trainer.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeRemaining(invitation.expiresAt)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Sent {new Date(invitation.sentAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Trainer Credentials Preview */}
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                    {invitation.trainer.trainerCertifications && invitation.trainer.trainerCertifications.length > 0 && (
                      <span className="flex items-center space-x-1">
                        <UserCheck className="h-3 w-3" />
                        <span>{invitation.trainer.trainerCertifications[0].certificationName}</span>
                      </span>
                    )}
                    {invitation.trainer.trainerSpecializations && invitation.trainer.trainerSpecializations.length > 0 && (
                      <span>
                        Specializes in {invitation.trainer.trainerSpecializations[0].specialization}
                      </span>
                    )}
                  </div>

                  {/* Custom Message Preview */}
                  {invitation.customMessage && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {invitation.customMessage}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleAccept(invitation)}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDecline(invitation)}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4" />
                        <span>Decline</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedInvitation(isExpanded ? null : invitation.id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <span>View Details</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-6 pl-16 border-l-2 border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Certifications */}
                    {invitation.trainer.trainerCertifications && invitation.trainer.trainerCertifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Certifications</h4>
                        <div className="space-y-2">
                          {invitation.trainer.trainerCertifications.map((cert, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <div className="font-medium">{cert.certificationName}</div>
                              <div className="text-xs text-gray-500">{cert.issuingOrganization}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specializations */}
                    {invitation.trainer.trainerSpecializations && invitation.trainer.trainerSpecializations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Specializations</h4>
                        <div className="space-y-2">
                          {invitation.trainer.trainerSpecializations.map((spec, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <div className="font-medium">{spec.specialization}</div>
                              {spec.yearsExperience && (
                                <div className="text-xs text-gray-500">{spec.yearsExperience} years experience</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Custom Message */}
                  {invitation.customMessage && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Message</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {invitation.customMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Invitation Details */}
                  <div className="mt-4 text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>Invitation sent to: {invitation.clientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvitationNotifications;