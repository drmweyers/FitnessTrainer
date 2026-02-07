import { useState, useEffect, useCallback } from 'react';
import { 
  ClientTag, 
  CreateTagData, 
  UpdateTagData 
} from '@/types/client';
import { tagsApi, ApiError } from '@/lib/api/clients';

interface UseTagsReturn {
  tags: ClientTag[];
  loading: boolean;
  error: string | null;
  refreshTags: () => Promise<void>;
  createTag: (data: CreateTagData) => Promise<ClientTag | null>;
  updateTag: (tagId: string, data: UpdateTagData) => Promise<ClientTag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
}

export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tagsApi.getTags();
      setTags(response || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch tags';
      setError(errorMessage);
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const refreshTags = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (data: CreateTagData): Promise<ClientTag | null> => {
    try {
      const response = await tagsApi.createTag(data);
      const newTag = response.data;
      
      // Add to local state
      setTags(prev => [...prev, newTag]);
      
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to create tag';
      setError(errorMessage);
      console.error('Error creating tag:', err);
      return null;
    }
  }, []);

  const updateTag = useCallback(async (tagId: string, data: UpdateTagData): Promise<ClientTag | null> => {
    try {
      const response = await tagsApi.updateTag(tagId, data);
      const updatedTag = response.data;
      
      // Update in local state
      setTags(prev => 
        prev.map(tag => 
          tag.id === tagId ? updatedTag : tag
        )
      );
      
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update tag';
      setError(errorMessage);
      console.error('Error updating tag:', err);
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    try {
      await tagsApi.deleteTag(tagId);
      
      // Remove from local state
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete tag';
      setError(errorMessage);
      console.error('Error deleting tag:', err);
      return false;
    }
  }, []);

  return {
    tags,
    loading,
    error,
    refreshTags,
    createTag,
    updateTag,
    deleteTag,
  };
};

// Hook for managing client tag assignments
interface UseClientTagsReturn {
  clientTags: ClientTag[];
  availableTags: ClientTag[];
  loading: boolean;
  error: string | null;
  assignTag: (tagId: string) => Promise<boolean>;
  removeTag: (tagId: string) => Promise<boolean>;
  assignMultipleTags: (tagIds: string[]) => Promise<boolean>;
  removeMultipleTags: (tagIds: string[]) => Promise<boolean>;
  refreshClientTags: () => Promise<void>;
}

export const useClientTags = (
  clientId: string,
  initialClientTags: ClientTag[] = []
): UseClientTagsReturn => {
  const { tags: allTags, loading: tagsLoading, error: tagsError } = useTags();
  const [clientTags, setClientTags] = useState<ClientTag[]>(initialClientTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientTags(initialClientTags);
  }, [initialClientTags]);

  // Combine errors from both hooks
  const combinedError = error || tagsError;
  const combinedLoading = loading || tagsLoading;

  const availableTags = allTags.filter(
    tag => !clientTags.some(clientTag => clientTag.id === tag.id)
  );

  const refreshClientTags = useCallback(async () => {
    // This would typically fetch the client's current tags
    // For now, we'll assume the parent component manages this
  }, []);

  const assignTag = useCallback(async (tagId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await tagsApi.assignTags(clientId, [tagId]);
      
      // Find the tag and add it to client tags
      const tagToAssign = allTags.find(tag => tag.id === tagId);
      if (tagToAssign) {
        setClientTags(prev => [...prev, tagToAssign]);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to assign tag';
      setError(errorMessage);
      console.error('Error assigning tag:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientId, allTags]);

  const removeTag = useCallback(async (tagId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await tagsApi.removeTags(clientId, [tagId]);
      
      // Remove from client tags
      setClientTags(prev => prev.filter(tag => tag.id !== tagId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to remove tag';
      setError(errorMessage);
      console.error('Error removing tag:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const assignMultipleTags = useCallback(async (tagIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await tagsApi.assignTags(clientId, tagIds);
      
      // Find the tags and add them to client tags
      const tagsToAssign = allTags.filter(tag => tagIds.includes(tag.id));
      setClientTags(prev => [...prev, ...tagsToAssign]);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to assign tags';
      setError(errorMessage);
      console.error('Error assigning multiple tags:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientId, allTags]);

  const removeMultipleTags = useCallback(async (tagIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await tagsApi.removeTags(clientId, tagIds);
      
      // Remove from client tags
      setClientTags(prev => prev.filter(tag => !tagIds.includes(tag.id)));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to remove tags';
      setError(errorMessage);
      console.error('Error removing multiple tags:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  return {
    clientTags,
    availableTags,
    loading: combinedLoading,
    error: combinedError,
    assignTag,
    removeTag,
    assignMultipleTags,
    removeMultipleTags,
    refreshClientTags,
  };
};