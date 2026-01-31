'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  Edit, 
  Archive, 
  Mail, 
  Phone, 
  Calendar, 
  Activity,
  MoreVertical,
  Tag,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Client, ClientStatus } from '@/types/client';

interface ClientCardProps {
  client: Client;
  onStatusChange: (status: ClientStatus) => void;
  onArchive: () => void;
}

const statusColors = {
  [ClientStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
  [ClientStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ClientStatus.OFFLINE]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ClientStatus.NEED_PROGRAMMING]: 'bg-red-100 text-red-800 border-red-200',
  [ClientStatus.ARCHIVED]: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusIcons = {
  [ClientStatus.ACTIVE]: '🟢',
  [ClientStatus.PENDING]: '🟡',
  [ClientStatus.OFFLINE]: '⚫',
  [ClientStatus.NEED_PROGRAMMING]: '🔴',
  [ClientStatus.ARCHIVED]: '📁',
};

export default function ClientCard({ client, onStatusChange, onArchive }: ClientCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  
  const currentStatus = client.trainerClient?.status || ClientStatus.PENDING;
  const profile = client.userProfile;
  const clientProfile = client.clientProfile;

  const handleViewClient = () => {
    router.push(`/dashboard/clients/${client.id}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ClientStatus;
    onStatusChange(newStatus);
  };

  const getTimeDisplay = () => {
    if (client.lastActivity) {
      return client.lastActivity;
    }
    if (client.lastLoginAt) {
      return `Last login: ${new Date(client.lastLoginAt).toLocaleDateString()}`;
    }
    return 'Never logged in';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
      <Card.Content className="p-0">
        {/* Header with Avatar and Basic Info */}
        <div className="p-6 pb-4" onClick={handleViewClient}>
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {client.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {client.displayName}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[currentStatus]}`}>
                  <span className="mr-1">{statusIcons[currentStatus]}</span>
                  {currentStatus}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 truncate mb-1">{client.email}</p>
              
              {profile?.phone && (
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Phone className="h-3 w-3 mr-1" />
                  {profile.phone}
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {getTimeDisplay()}
              </div>
            </div>
            
            {/* Actions Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClient();
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit - could open a modal or navigate to edit page
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle message
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive();
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Client
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="px-6 pb-4">
          {/* Goals or Profile Info */}
          {clientProfile?.goals?.primaryGoal && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Primary Goal</p>
              <p className="text-sm text-gray-600">{clientProfile.goals.primaryGoal}</p>
            </div>
          )}
          
          {/* Fitness Level */}
          {clientProfile?.fitnessLevel && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {clientProfile.fitnessLevel} level
              </span>
            </div>
          )}
          
          {/* Tags */}
          {client.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {client.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}30`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                {client.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{client.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">
                  {client.notesCount || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Notes</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Tag className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">
                  {client.tags.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Tags</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">
                  {client.isVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Verified</p>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            {/* Status Selector - Quick Change */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-500">Status:</label>
              <select
                value={currentStatus}
                onChange={handleStatusChange}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border-none bg-transparent text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1"
              >
                <option value={ClientStatus.ACTIVE}>Active</option>
                <option value={ClientStatus.PENDING}>Pending</option>
                <option value={ClientStatus.OFFLINE}>Offline</option>
                <option value={ClientStatus.NEED_PROGRAMMING}>Need Programming</option>
              </select>
            </div>
            
            {/* View Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleViewClient();
              }}
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}