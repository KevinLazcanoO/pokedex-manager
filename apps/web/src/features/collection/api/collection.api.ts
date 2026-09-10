import type {
  CollectionEntry,
  CollectionQuery,
  CollectionStats,
  CreateEntryInput,
  UpdateEntryInput,
} from '@pokedex/shared';

import { apiRequest } from '../../../lib/api-client';

export function fetchStats(): Promise<CollectionStats> {
  return apiRequest<CollectionStats>('/collection/stats');
}

export function fetchCollection(query: Partial<CollectionQuery> = {}): Promise<CollectionEntry[]> {
  return apiRequest<CollectionEntry[]>('/collection', {
    query: {
      search: query.search,
      type: query.type,
      favorite: query.favorite,
      sort: query.sort,
    },
  });
}

export function addToCollection(input: CreateEntryInput): Promise<CollectionEntry> {
  return apiRequest<CollectionEntry>('/collection', { method: 'POST', body: input });
}

export function updateEntry(id: string, input: UpdateEntryInput): Promise<CollectionEntry> {
  return apiRequest<CollectionEntry>(`/collection/${id}`, { method: 'PATCH', body: input });
}

export function deleteEntry(id: string): Promise<void> {
  return apiRequest<void>(`/collection/${id}`, { method: 'DELETE' });
}
