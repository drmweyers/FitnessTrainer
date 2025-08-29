'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Users, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  User,
  Filter,
  ChevronDown,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Program } from '@/types/program';
import { Client, ClientStatus } from '@/types/client';

interface BulkAssignmentModalProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (clientIds: string[], customizations: AssignmentCustomizations) => Promise<void>;
}

interface AssignmentCustomizations {
  startDate: string;
  notes?: string;
  allowModifications: boolean;
  sendNotification: boolean;
  customDuration?: number;
}

interface ClientWithSelection extends Client {
  isSelected: boolean;
}

const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({
  program,
  isOpen,
  onClose,
  onAssign
}) => {
  const [clients, setClients] = useState<ClientWithSelection[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Assignment customizations
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Default to tomorrow
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [allowModifications, setAllowModifications] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [customDuration, setCustomDuration] = useState<number | undefined>();

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => 
        client.trainerClient?.status === statusFilter
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, statusFilter]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Mock data - in real app, fetch from API
      const mockClients: ClientWithSelection[] = [
        {
          id: '1',
          displayName: 'John Smith',
          email: 'john@example.com',
          isSelected: false,
          trainerClient: { status: ClientStatus.ACTIVE },
          userProfile: { phone: '+1-555-0123' },
          clientProfile: { 
            goals: { primaryGoal: 'Lose weight' },
            fitnessLevel: 'intermediate'
          },
          tags: [],
          notesCount: 3,
          isVerified: true,
          lastActivity: '2 days ago',
          lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          displayName: 'Sarah Johnson',
          email: 'sarah@example.com',
          isSelected: false,
          trainerClient: { status: ClientStatus.ACTIVE },
          userProfile: { phone: '+1-555-0124' },
          clientProfile: { 
            goals: { primaryGoal: 'Build muscle' },
            fitnessLevel: 'beginner'
          },
          tags: [],
          notesCount: 1,
          isVerified: true,
          lastActivity: '1 day ago',
          lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          displayName: 'Mike Wilson',
          email: 'mike@example.com',
          isSelected: false,
          trainerClient: { status: ClientStatus.NEED_PROGRAMMING },
          userProfile: { phone: '+1-555-0125' },
          clientProfile: { 
            goals: { primaryGoal: 'Improve strength' },
            fitnessLevel: 'advanced'
          },
          tags: [],
          notesCount: 0,
          isVerified: true,
          lastActivity: '5 days ago',
          lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setClients(mockClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, isSelected: !client.isSelected }
        : client
    ));
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredClients.map(c => c.id));
    setClients(prev => prev.map(client =>
      visibleIds.has(client.id)
        ? { ...client, isSelected: true }
        : client
    ));
  };

  const deselectAll = () => {
    setClients(prev => prev.map(client => ({ ...client, isSelected: false })));
  };

  const selectedClients = clients.filter(c => c.isSelected);

  const handleAssign = async () => {
    if (selectedClients.length === 0) return;

    setIsAssigning(true);
    try {
      const customizations: AssignmentCustomizations = {
        startDate,
        notes: notes || undefined,
        allowModifications,
        sendNotification,
        customDuration: customDuration || undefined
      };

      await onAssign(selectedClients.map(c => c.id), customizations);
      onClose();
    } catch (error) {
      console.error('Failed to assign program:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Assign Program to Clients</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Assigning: <span className="font-medium">{program.name}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {/* Program Info */}
              <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{program.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {program.durationWeeks} weeks
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {program.assignments?.filter(a => a.isActive).length || 0} active assignments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Selection */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Select Clients</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search clients by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {showFilters && (
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="all">All Statuses</option>
                          <option value={ClientStatus.ACTIVE}>Active</option>
                          <option value={ClientStatus.NEED_PROGRAMMING}>Need Programming</option>
                          <option value={ClientStatus.PENDING}>Pending</option>
                          <option value={ClientStatus.OFFLINE}>Offline</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedClients.length} of {filteredClients.length} clients selected
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllVisible}>
                      Select All Visible
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Client List */}
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Loading clients...</div>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">No clients found</div>
                    </div>
                  ) : (
                    filteredClients.map(client => (
                      <div
                        key={client.id}
                        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer ${
                          client.isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => toggleClientSelection(client.id)}
                      >
                        <input
                          type="checkbox"
                          checked={client.isSelected}
                          onChange={() => toggleClientSelection(client.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {client.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{client.displayName}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              client.trainerClient?.status === ClientStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                              client.trainerClient?.status === ClientStatus.NEED_PROGRAMMING ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {client.trainerClient?.status || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{client.email}</div>
                          {client.clientProfile?.goals?.primaryGoal && (
                            <div className="text-xs text-gray-500">Goal: {client.clientProfile.goals.primaryGoal}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assignment Customizations */}
              {selectedClients.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Duration (optional)
                      </label>
                      <input
                        type="number"
                        placeholder={`Default: ${program.durationWeeks} weeks`}
                        value={customDuration || ''}
                        onChange={(e) => setCustomDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="52"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes for this assignment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowModifications"
                        checked={allowModifications}
                        onChange={(e) => setAllowModifications(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="allowModifications" className="ml-2 text-sm text-gray-700">
                        Allow clients to modify exercises and weights
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendNotification"
                        checked={sendNotification}
                        onChange={(e) => setSendNotification(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="sendNotification" className="ml-2 text-sm text-gray-700">
                        Send notification to clients about new assignment
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedClients.length > 0 ? (
                    <>
                      Ready to assign <span className="font-medium">{program.name}</span> to{' '}
                      <span className="font-medium">{selectedClients.length}</span> client{selectedClients.length !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'Select clients to assign this program'
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={selectedClients.length === 0 || isAssigning}
                  >
                    {isAssigning ? 'Assigning...' : `Assign to ${selectedClients.length} Client${selectedClients.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;