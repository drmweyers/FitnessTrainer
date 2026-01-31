'use client';

import React, { useState } from 'react';
import { Plus, Download, Search, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import ClientCard from '@/components/clients/ClientCard';
import ClientForm from '@/components/clients/ClientForm';
import ClientInviteForm from '@/components/clients/ClientInviteForm';
import TagManager from '@/components/clients/TagManager';
import { useClients, useInvitations } from '@/hooks/useClients';
import { ClientStatus, ClientFilters } from '@/types/client';

const statusOptions = [
  { value: '', label: 'All Clients' },
  { value: ClientStatus.ACTIVE, label: 'Active' },
  { value: ClientStatus.PENDING, label: 'Pending' },
  { value: ClientStatus.OFFLINE, label: 'Offline' },
  { value: ClientStatus.NEED_PROGRAMMING, label: 'Need Programming' },
  { value: ClientStatus.ARCHIVED, label: 'Archived' },
];

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'lastActivity', label: 'Last Activity' },
];

export default function ClientManagementPage() {
  // State management
  const {
    clients,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refreshClients,
    createClient,
    updateClientStatus,
    archiveClient,
  } = useClients();

  const { inviteClient } = useInvitations();

  // Modal states
  const [showClientForm, setShowClientForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  // Search and filter handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ 
      status: status ? (status as ClientStatus) : undefined 
    });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy: sortBy as ClientFilters['sortBy'] });
  };

  const handleSortOrderToggle = () => {
    setFilters({ 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  // Action handlers
  const handleCreateClient = async (data: any) => {
    const success = await createClient(data);
    if (success) {
      setShowClientForm(false);
    }
  };

  const handleInviteClient = async (data: any) => {
    const success = await inviteClient(data);
    if (success) {
      setShowInviteForm(false);
    }
  };

  const handleStatusChange = async (clientId: string, status: ClientStatus) => {
    await updateClientStatus(clientId, status);
  };

  const handleArchiveClient = async (clientId: string) => {
    if (confirm('Are you sure you want to archive this client?')) {
      await archiveClient(clientId);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Error Loading Clients
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <Button 
                    onClick={refreshClients}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Client Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {pagination?.total || 0} total clients
                </p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTagManager(true)}
                className="w-full sm:w-auto"
              >
                Manage Tags
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteForm(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Invite Client
              </Button>
              <Button
                onClick={() => setShowClientForm(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={filters.search || ''}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Controls - Mobile-optimized */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              {/* Status Filter */}
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort Control */}
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy || 'name'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="flex-1 sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortOrderToggle}
                  className="px-3 h-10"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                className="whitespace-nowrap w-full sm:w-auto"
                size="sm"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients found
            </h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.status 
                ? "Try adjusting your search or filters." 
                : "Get started by adding your first client or sending an invitation."
              }
            </p>
            <div className="space-x-3">
              <Button onClick={() => setShowClientForm(true)}>
                Add Client
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(true)}>
                Send Invitation
              </Button>
            </div>
          </div>
        ) : (
          // Client grid
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onStatusChange={(status) => handleStatusChange(client.id, status)}
                  onArchive={() => handleArchiveClient(client.id)}
                />
              ))}
            </div>

            {/* Pagination - Mobile-responsive */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 7) {
                      page = i + 1;
                    } else if (pagination.page <= 4) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 3) {
                      page = pagination.totalPages - 6 + i;
                    } else {
                      page = pagination.page - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[40px] flex-shrink-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showClientForm && (
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowClientForm(false)}
        />
      )}
      
      {showInviteForm && (
        <ClientInviteForm
          onSubmit={handleInviteClient}
          onCancel={() => setShowInviteForm(false)}
        />
      )}
      
      {showTagManager && (
        <TagManager
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  );
}