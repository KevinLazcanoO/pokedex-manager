import type { AnalysisStatus, CollectionAnalysis } from '@pokedex/shared';

import { apiRequest } from '../../../lib/api-client';

export function fetchAnalysisStatus(): Promise<AnalysisStatus> {
  return apiRequest<AnalysisStatus>('/analysis/status');
}

export function generateAnalysis(): Promise<CollectionAnalysis> {
  return apiRequest<CollectionAnalysis>('/analysis', { method: 'POST' });
}
