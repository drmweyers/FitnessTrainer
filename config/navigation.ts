import {
  Home,
  Users,
  UserPlus,
  Dumbbell,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  User,
  TrendingUp
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
    id: 'admin-clients',
    label: 'Clients',
    href: '/clients',
    icon: Users,
    roles: ['admin']
  },
  {
    id: 'admin-programs',
    label: 'Programs',
    href: '/programs',
    icon: ClipboardList,
    roles: ['admin']
  },
  {
    id: 'admin-exercises',
    label: 'Exercises',
    href: '/exercises',
    icon: Dumbbell,
    roles: ['admin']
  },
  {
    id: 'admin-analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin']
  },

  // Trainer-specific navigation
  {
    id: 'my-clients',
    label: 'My Clients',
    href: '/clients',
    icon: Users,
    roles: ['trainer']
  },
  {
    id: 'trainer-programs',
    label: 'Programs',
    href: '/programs',
    icon: ClipboardList,
    roles: ['trainer'],
    children: [
      {
        id: 'my-programs',
        label: 'My Programs',
        href: '/programs',
        icon: ClipboardList,
        roles: ['trainer']
      },
      {
        id: 'create-program',
        label: 'Create Program',
        href: '/programs/new',
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
    id: 'workouts',
    label: 'Workouts',
    href: '/workouts',
    icon: Calendar,
    roles: ['trainer']
  },
  {
    id: 'trainer-analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['trainer']
  },

  // Client-specific navigation
  {
    id: 'my-workouts',
    label: 'My Workouts',
    href: '/workouts',
    icon: Dumbbell,
    roles: ['client']
  },
  {
    id: 'my-programs',
    label: 'My Programs',
    href: '/programs',
    icon: ClipboardList,
    roles: ['client']
  },
  {
    id: 'progress',
    label: 'Progress',
    href: '/workouts/progress',
    icon: TrendingUp,
    roles: ['client']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
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
    href: '/profile/edit',
    icon: Settings
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