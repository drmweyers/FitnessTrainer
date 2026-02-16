'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface Client {
  id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface ClientSelectorProps {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientChange,
}) => {
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['trainer-clients'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const json = await response.json();
      return json.data || json;
    },
  });

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading clients...
      </div>
    );
  }

  const getClientDisplayName = (client: Client) => {
    if (client.profile?.firstName && client.profile?.lastName) {
      return `${client.profile.firstName} ${client.profile.lastName}`;
    }
    return client.email;
  };

  return (
    <div className="mb-6">
      <label htmlFor="client-selector" className="block text-sm font-medium text-gray-700 mb-2">
        View Analytics For
      </label>
      <select
        id="client-selector"
        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={selectedClientId || ''}
        onChange={(e) => onClientChange(e.target.value || null)}
      >
        <option value="">My Data</option>
        {clients?.map((client) => (
          <option key={client.id} value={client.id}>
            {getClientDisplayName(client)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientSelector;
