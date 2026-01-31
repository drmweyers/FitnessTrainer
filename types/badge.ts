export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria?: string;
  category?: string;
  points?: number;
  dateEarned?: string;
  progress?: number;
  status?: 'active' | 'inactive';
} 