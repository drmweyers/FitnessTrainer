// Client management types that match backend API

export enum ClientStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  OFFLINE = 'offline',
  NEED_PROGRAMMING = 'need_programming',
  ARCHIVED = 'archived'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired'
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface ClientGoals {
  primaryGoal: string;
  targetWeight?: number;
  targetBodyFat?: number;
  timeframe?: string;
  additionalNotes?: string;
}

export interface ClientPreferences {
  workoutDays: string[];
  sessionDuration: number;
  equipmentAccess: string[];
  specialRequests?: string;
}

export interface ClientTag {
  id: string;
  name: string;
  color: string;
  trainerId: string;
}

export interface ClientNote {
  id: string;
  trainerId: string;
  clientId: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  emergencyContact?: EmergencyContact;
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  injuries?: any;
  fitnessLevel: FitnessLevel;
  goals?: ClientGoals;
  preferences?: ClientPreferences;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  timezone?: string;
  preferredUnits: 'metric' | 'imperial';
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  isPublic: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  
  // Profile information
  userProfile?: UserProfile;
  clientProfile?: ClientProfile;
  
  // Trainer-client relationship
  trainerClient?: {
    id: string;
    trainerId: string;
    clientId: string;
    status: ClientStatus;
    connectedAt?: string;
    archivedAt?: string;
  };
  
  // Tags and notes
  tags: ClientTag[];
  notesCount?: number;
  lastActivity?: string;
  
  // Computed display fields
  displayName: string;
  avatar?: string;
}

export interface ClientListResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientInvitation {
  id: string;
  trainerId: string;
  clientEmail: string;
  token: string;
  status: InvitationStatus;
  customMessage?: string;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'dateAdded' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateClientData {
  email: string;
  firstName?: string;
  lastName?: string;
  fitnessLevel?: FitnessLevel;
  goals?: ClientGoals;
  preferences?: ClientPreferences;
  emergencyContact?: EmergencyContact;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface InviteClientData {
  clientEmail: string;
  customMessage?: string;
}

export interface UpdateClientData {
  status?: ClientStatus;
  fitnessLevel?: FitnessLevel;
  goals?: ClientGoals;
  preferences?: ClientPreferences;
  emergencyContact?: EmergencyContact;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface CreateTagData {
  name: string;
  color: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export interface NotePagination {
  page?: number;
  limit?: number;
}

export interface NotesResponse {
  notes: ClientNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}