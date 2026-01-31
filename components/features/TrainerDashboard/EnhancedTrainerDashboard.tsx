'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import ClientConnectionList from '@/components/features/ClientManagement/ClientConnectionList';
import InviteClientModal from '@/components/features/ClientManagement/InviteClientModal';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import { clientConnectionService, InviteClientData } from '@/services/clientConnectionService';
import {
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { QuickAction, ActivityFeedItem } from '@/types/dashboard';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  completionRate: number;
  averageRating: number;
}

const EnhancedTrainerDashboard: React.FC = () => {
  // const { user } = useAuth(); // Not used, keeping for auth context
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    completionRate: 0,
    averageRating: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientsData = await clientConnectionService.getTrainerClients({ limit: 50 });
      
      // Calculate stats from real client data
      const totalClients = clientsData.clients.length;
      const activeClients = clientsData.clients.filter(c => c.status === 'active').length;
      const pendingClients = clientsData.clients.filter(c => c.status === 'pending').length;
      
      setStats({
        totalClients,
        activeClients,
        pendingClients,
        completionRate: 87.5, // Mock data for now
        averageRating: 4.7 // Mock data for now
      });

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'client_signup' as const,
          title: 'New Client Connection',
          description: 'A client accepted your training invitation',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: { id: 'c1', name: 'New Client' }
        },
        {
          id: '2',
          type: 'system_event' as const,
          title: 'Invitation Sent',
          description: 'Invitation sent to potential client',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteClient = async (email: string, message?: string) => {
    try {
      const inviteData: InviteClientData = {
        clientEmail: email,
        customMessage: message
      };

      await clientConnectionService.inviteClient(inviteData);
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Create Program',
      description: 'Design a new workout program',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/programs/new',
      color: 'blue' as const
    },
    {
      id: '2',
      title: 'Invite Client',
      description: 'Send invitation to new client',
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => setShowInviteModal(true),
      color: 'green' as const
    },
    {
      id: '3',
      title: 'View Calendar',
      description: 'Manage appointments and sessions',
      icon: <Calendar className="h-5 w-5" />,
      href: '/calendar',
      color: 'purple' as const
    },
    {
      id: '4',
      title: 'Client Reports',
      description: 'View progress and analytics',
      icon: <Activity className="h-5 w-5" />,
      href: '/analytics',
      color: 'yellow' as const
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Manage clients and programs">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Trainer Dashboard"
      subtitle="Manage your clients and programs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trainer' }
      ]}
      actions={
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Client</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="total-clients"
            title="Total Clients"
            value={stats.totalClients}
            change={{
              value: 14.3,
              type: 'increase',
              period: 'vs last month'
            }}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            id="active-clients"
            title="Active Clients"
            value={stats.activeClients}
            subtitle="currently training"
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            id="pending-clients"
            title="Pending Invitations"
            value={stats.pendingClients}
            subtitle="awaiting response"
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
          />
          <StatCard
            id="completion-rate"
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            change={{
              value: 5.2,
              type: 'increase',
              period: 'this month'
            }}
            icon={<Award className="h-5 w-5" />}
            color="purple"
          />
        </div>

        {/* Client Connection List */}
        <ClientConnectionList onInviteClient={() => setShowInviteModal(true)} />

        {/* Quick Actions and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions
            actions={quickActions}
            title="Quick Actions"
            gridCols={2}
          />
          <ActivityFeed
            activities={recentActivities}
            maxItems={6}
            showLoadMore={true}
            emptyMessage="No recent activity"
          />
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Month's Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
              <p className="text-sm text-blue-800">Total Clients</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalClients - stats.pendingClients}
              </p>
              <p className="text-sm text-green-800">Connected Clients</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.averageRating}</p>
              <p className="text-sm text-purple-800">Average Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Client Modal */}
      <InviteClientModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteClient}
      />
    </DashboardLayout>
  );
};

export default EnhancedTrainerDashboard;