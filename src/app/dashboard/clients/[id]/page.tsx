'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  Activity,
  Heart,
  AlertTriangle,
  User,
  Target,
  Clock,
  Tag,
  MessageSquare,
  FileText,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import ClientNotes from '@/components/clients/ClientNotes';
import ClientTags from '@/components/clients/ClientTags';
import ClientForm from '@/components/clients/ClientForm';
import { useClient } from '@/hooks/useClients';
import { ClientStatus, FitnessLevel } from '@/types/client';

const statusColors = {
  [ClientStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ClientStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ClientStatus.OFFLINE]: 'bg-gray-100 text-gray-800',
  [ClientStatus.NEED_PROGRAMMING]: 'bg-red-100 text-red-800',
  [ClientStatus.ARCHIVED]: 'bg-gray-100 text-gray-600',
};

const fitnessLevelColors = {
  [FitnessLevel.BEGINNER]: 'bg-blue-100 text-blue-800',
  [FitnessLevel.INTERMEDIATE]: 'bg-orange-100 text-orange-800',
  [FitnessLevel.ADVANCED]: 'bg-purple-100 text-purple-800',
};

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const { client, loading, error, refreshClient } = useClient(clientId);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Client Not Found
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {error || 'The client you are looking for could not be found.'}
                </p>
                <div className="mt-4 space-x-3">
                  <Button 
                    onClick={() => router.back()}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={refreshClient}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = client.userProfile;
  const clientProfile = client.clientProfile;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {client.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {client.displayName}
                    </h1>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[client.trainerClient?.status || ClientStatus.PENDING]}`}>
                      {client.trainerClient?.status || 'pending'}
                    </span>
                    {clientProfile?.fitnessLevel && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${fitnessLevelColors[clientProfile.fitnessLevel]}`}>
                        {clientProfile.fitnessLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{client.email}</p>
                  {profile?.phone && (
                    <p className="text-gray-600">{profile.phone}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Client since {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                leftIcon={<Mail className="h-4 w-4" />}
                size="sm"
              >
                Message
              </Button>
              <Button
                onClick={() => setShowEditForm(true)}
                leftIcon={<Edit className="h-4 w-4" />}
                size="sm"
              >
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <Card.Header>
                    <Card.Title className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Contact Information
                    </Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{client.email}</span>
                        </div>
                      </div>
                      {profile?.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{profile.phone}</span>
                          </div>
                        </div>
                      )}
                      {profile?.dateOfBirth && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {new Date(profile.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                      {profile?.gender && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <span className="text-sm text-gray-900 capitalize">{profile.gender}</span>
                        </div>
                      )}
                    </div>
                  </Card.Content>
                </Card>

                {/* Goals */}
                {clientProfile?.goals && (
                  <Card>
                    <Card.Header>
                      <Card.Title className="flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Fitness Goals
                      </Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Primary Goal</label>
                          <p className="text-sm text-gray-900 mt-1">{clientProfile.goals.primaryGoal}</p>
                        </div>
                        {clientProfile.goals.targetWeight && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Target Weight</label>
                            <p className="text-sm text-gray-900 mt-1">{clientProfile.goals.targetWeight} lbs</p>
                          </div>
                        )}
                        {clientProfile.goals.timeframe && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                            <p className="text-sm text-gray-900 mt-1">{clientProfile.goals.timeframe}</p>
                          </div>
                        )}
                        {clientProfile.goals.additionalNotes && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                            <p className="text-sm text-gray-900 mt-1">{clientProfile.goals.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Health Information */}
                {clientProfile && (
                  <Card>
                    <Card.Header>
                      <Card.Title className="flex items-center">
                        <Heart className="h-5 w-5 mr-2" />
                        Health Information
                      </Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div className="space-y-4">
                        {clientProfile.medicalConditions.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {clientProfile.medicalConditions.map((condition, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clientProfile.medications.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Medications</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {clientProfile.medications.map((medication, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {medication}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clientProfile.allergies.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Allergies</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {clientProfile.allergies.map((allergy, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Emergency Contact */}
                {clientProfile?.emergencyContact && (
                  <Card>
                    <Card.Header>
                      <Card.Title className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Emergency Contact
                      </Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-sm text-gray-900 mt-1">{clientProfile.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Relationship</label>
                          <p className="text-sm text-gray-900 mt-1">{clientProfile.emergencyContact.relationship}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{clientProfile.emergencyContact.phone}</span>
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <ClientNotes clientId={clientId} />
            )}

            {activeTab === 'tags' && (
              <ClientTags clientId={clientId} />
            )}

            {activeTab === 'activity' && (
              <Card>
                <Card.Header>
                  <Card.Title>Recent Activity</Card.Title>
                </Card.Header>
                <Card.Content>
                  <p className="text-gray-500">Activity tracking coming soon...</p>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <Card.Header>
                <Card.Title>Quick Stats</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[client.trainerClient?.status || ClientStatus.PENDING]}`}>
                      {client.trainerClient?.status || 'pending'}
                    </span>
                  </div>
                  {clientProfile?.fitnessLevel && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fitness Level</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${fitnessLevelColors[clientProfile.fitnessLevel]}`}>
                        {clientProfile.fitnessLevel}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notes</span>
                    <span className="text-sm font-medium">{client.notesCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tags</span>
                    <span className="text-sm font-medium">{client.tags.length}</span>
                  </div>
                  {client.lastActivity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm text-gray-900">{client.lastActivity}</span>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Current Tags */}
            {client.tags.length > 0 && (
              <Card>
                <Card.Header>
                  <Card.Title>Current Tags</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <ClientForm
          client={client}
          onSubmit={async (data) => {
            // Handle update
            setShowEditForm(false);
            refreshClient();
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}