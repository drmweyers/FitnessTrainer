// src/types/index.ts
export interface Level {
    id: string
    name: string
    description: string
    numChallenges: number
    thumbnailUrl: string
    thumbnailType?: number
    thumbnailAttachmentId?: string
    thumbnailAttachmentName?: string
    createdAt?: Date
    updatedAt?: Date
  }
  
  export interface PaginationMeta {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
  
  export interface ApiResponse<T> {
    data: T
    meta?: PaginationMeta
    error?: string
  }