export interface Exercise {
    id: string
    name: string
    thumbnail: string
    hasVideo: boolean
    muscleGroup: string
    equipment: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }