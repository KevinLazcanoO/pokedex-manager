import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAnalysisStatus, generateAnalysis } from './api/analysis.api';

const ANALYSIS_KEY = ['analysis'] as const;
const STATUS_KEY = [...ANALYSIS_KEY, 'status'] as const;

export function useAnalysisStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: fetchAnalysisStatus,
  });
}

export function useGenerateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateAnalysis,
    onSettled: () => {
      // Haya salido bien o mal, el cupo que le queda al usuario ha podido cambiar.
      void queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });
}
