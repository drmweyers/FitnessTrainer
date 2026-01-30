/**
 * ClientProfile Component
 *
 * Displays client information card with photo, contact details, and edit option.
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, MapPin, Edit } from 'lucide-react';
import { Client } from '@/types/client';

interface ClientProfileProps {
  client: Client;
}

export function ClientProfile({ client }: ClientProfileProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
    need_programming: 'bg-orange-100 text-orange-800',
    archived: 'bg-red-100 text-red-800',
  };

  const status = client.trainerClient?.status || 'pending';
  const displayName = client.displayName || client.email;
  const profilePhoto = client.userProfile?.profilePhotoUrl || client.avatar;
  const phone = client.userProfile?.phone;
  const location = client.userProfile?.timezone || 'Not specified';
  const joinDate = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString()
    : 'Unknown';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <h2 className="text-lg font-semibold">Client Profile</h2>
        <Link href={`/clients/${client.id}/edit`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Profile Photo and Name */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white text-2xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{displayName}</h3>
          <p className="text-sm text-gray-600">{client.email}</p>
          <Badge
            className={`mt-2 ${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}
          >
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 pt-4 border-t">
          {phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 text-gray-500 mr-3" />
              <span className="text-gray-700">{phone}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 text-gray-500 mr-3" />
            <span className="text-gray-700">{client.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 text-gray-500 mr-3" />
            <span className="text-gray-700">Joined {joinDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 text-gray-500 mr-3" />
            <span className="text-gray-700">{location}</span>
          </div>
        </div>

        {/* Fitness Level */}
        {client.clientProfile?.fitnessLevel && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-1">Fitness Level</p>
            <p className="text-sm font-medium capitalize text-gray-800">
              {client.clientProfile.fitnessLevel}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          <Link href={`/clients/${client.id}/programs`}>
            <Button variant="outline" className="w-full">
              View Programs
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/history`}>
            <Button variant="outline" className="w-full">
              View History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
