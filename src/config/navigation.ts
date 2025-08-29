import { 
  Home,
  Users,
  UserCheck,
  UserPlus,
  Dumbbell,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  User,
  TrendingUp,
  Target,
  Award,
  BookOpen
} from 'lucide-react';
import type { UserRole } from '@/types/auth';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  children?: NavigationItem[];
  badge?: string | number;
}

export const navigationConfig: NavigationItem[] = [
  // Dashboard - All roles
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'trainer', 'client']
  },

  // Admin-specific navigation
  {
    id: 'users',
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin']
  },
  {
    id: 'trainers',
    label: 'Trainers',
    href: '/admin/trainers',
    icon: UserCheck,
    roles: ['admin']
  },
  {
    id: 'admin-clients',
    label: 'Clients',
    href: '/admin/clients',
    icon: UserPlus,
    roles: ['admin']
  },
  {
    id: 'admin-programs',
    label: 'Programs',
    href: '/admin/programs',
    icon: ClipboardList,
    roles: ['admin']
  },
  {
    id: 'admin-analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin']
  },
  {
    id: 'admin-settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['admin']
  },

  // Trainer-specific navigation
  {
    id: 'my-clients',
    label: 'My Clients',
    href: '/trainer/clients',
    icon: Users,
    roles: ['trainer']
  },
  {
    id: 'trainer-programs',
    label: 'Programs',
    href: '/trainer/programs',
    icon: ClipboardList,
    roles: ['trainer'],
    children: [
      {
        id: 'my-programs',
        label: 'My Programs',
        href: '/trainer/programs',
        icon: ClipboardList,
        roles: ['trainer']
      },
      {
        id: 'create-program',
        label: 'Create Program',
        href: '/trainer/programs/new',
        icon: UserPlus,
        roles: ['trainer']
      }
    ]
  },
  {
    id: 'exercises',
    label: 'Exercises',
    href: '/exercises',
    icon: Dumbbell,
    roles: ['trainer']
  },
  {
    id: 'schedule',
    label: 'Calendar',
    href: '/trainer/schedule',
    icon: Calendar,
    roles: ['trainer']
  },
  {
    id: 'trainer-analytics',
    label: 'Analytics',
    href: '/trainer/analytics',
    icon: BarChart3,
    roles: ['trainer']
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: ['trainer', 'client'],
    badge: '3' // Example notification count
  },

  // Client-specific navigation
  {
    id: 'my-workouts',
    label: 'My Workouts',
    href: '/client/workouts',
    icon: Dumbbell,
    roles: ['client']
  },
  {
    id: 'my-programs',
    label: 'My Programs',
    href: '/client/programs',
    icon: ClipboardList,
    roles: ['client']
  },
  {
    id: 'progress',
    label: 'Progress',
    href: '/client/progress',
    icon: TrendingUp,
    roles: ['client']
  },
  {
    id: 'goals',
    label: 'Goals',
    href: '/client/goals',
    icon: Target,
    roles: ['client']
  },
  {
    id: 'achievements',
    label: 'Achievements',
    href: '/client/achievements',
    icon: Award,
    roles: ['client']
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['client']
  }
];

// Filter navigation items based on user role
export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  return navigationConfig.filter(item => item.roles.includes(role));
};

// Get user menu items (common across all roles)
export const getUserMenuItems = () => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    label: 'Profile Settings',
    href: '/profile/settings',
    icon: Settings
  },
  {
    label: 'Help & Support',
    href: '/help',
    icon: BookOpen
  }
];

// Role display names and colors
export const roleConfig = {
  admin: {
    label: 'Administrator',
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-400'
  },
  trainer: {
    label: 'Trainer',
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-400'
  },
  client: {
    label: 'Client',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-400'
  }
} as const;