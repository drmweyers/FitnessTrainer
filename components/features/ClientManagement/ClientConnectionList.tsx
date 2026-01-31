'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Archive
} from 'lucide-react';

interface ClientConnection {
  id: string;
  status: 'active' | 'pending' | 'inactive' | 'archived';
  connectedAt: string;
  client: {
    id: string;
    email: string;
    userProfile?: {
      bio?: string;
    };
    clientProfile?: {
      fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
      goals?: any;
    };
    lastLoginAt?: string;
  };
  // Add progress and program info if needed
}

interface ClientConnectionListProps {
  onInviteClient: () => void;
}

const ClientConnectionList: React.FC<ClientConnectionListProps> = ({
  onInviteClient
}) => {
  const [clients, setClients] = useState<ClientConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    const mockClients: ClientConnection[] = [
      {
        id: '1',
        status: 'active',
        connectedAt: '2024-01-15T10:00:00Z',
        client: {
          id: 'c1',
          email: 'sarah.johnson@example.com',
          userProfile: { bio: 'Sarah Johnson' },
          clientProfile: { 
            fitnessLevel: 'intermediate',
            goals: { primaryGoal: 'Weight Loss', targetWeight: 140 }
          },
          lastLoginAt: '2024-01-20T08:00:00Z'
        }
      },
      {
        id: '2',
        status: 'active',
        connectedAt: '2024-01-10T14:30:00Z',
        client: {
          id: 'c2',
          email: 'mike.chen@example.com',
          userProfile: { bio: 'Mike Chen' },
          clientProfile: { 
            fitnessLevel: 'beginner',
            goals: { primaryGoal: 'Muscle Gain' }
          },
          lastLoginAt: '2024-01-19T19:00:00Z'
        }
      },
      {
        id: '3',
        status: 'pending',
        connectedAt: '2024-01-18T16:00:00Z',
        client: {
          id: 'c3',
          email: 'emily.rodriguez@example.com',
          userProfile: { bio: 'Emily Rodriguez' },
          clientProfile: { fitnessLevel: 'advanced' }
        }
      }
    ];

    setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'archived':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getClientName = (client: ClientConnection['client']) => {
    return client.userProfile?.bio || client.email.split('@')[0] || 'Unknown Client';
  };

  const getLastActivity = (lastLoginAt?: string) => {
    if (!lastLoginAt) return 'Never';
    
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const filteredClients = clients.filter(connection => {
    const matchesSearch = searchTerm === '' || 
      getClientName(connection.client).toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    inactive: clients.filter(c => c.status === 'inactive').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>My Clients ({stats.total})</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your connected clients and training relationships
            </p>
          </div>
          <button
            onClick={onInviteClient}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Client</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">{stats.active}</div>
            <div className="text-xs text-green-700">Active</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-600">{stats.inactive}</div>
            <div className="text-xs text-gray-700">Inactive</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-700">Total</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Client List */}
      <div className="divide-y divide-gray-200">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No clients match your search' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Start building your client base by sending invitations'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={onInviteClient}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Invite Your First Client</span>
              </button>
            )}
          </div>
        ) : (
          filteredClients.map((connection) => (
            <div key={connection.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {getClientName(connection.client).charAt(0).toUpperCase()}
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getClientName(connection.client)}
                    </h3>
                    <span className={getStatusBadge(connection.status)}>
                      {getStatusIcon(connection.status)}
                      <span className="capitalize">{connection.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {connection.client.email}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Level: {connection.client.clientProfile?.fitnessLevel || 'Not set'}</span>
                    <span>•</span>
                    <span>Last active: {getLastActivity(connection.client.lastLoginAt)}</span>
                    <span>•</span>
                    <span>Connected: {new Date(connection.connectedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {connection.status === 'active' && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <TrendingUp className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientConnectionList;