import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import type { VideoAnalysisResult, ProcessingStatus, CameraModeData, CameraModeType } from '../backend';

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, videoBlob }: { id: string; videoBlob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.uploadVideo(id, videoBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoStatus'] });
    },
  });
}

export function useVideoStatus(videoId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ProcessingStatus | null>({
    queryKey: ['videoStatus', videoId],
    queryFn: async () => {
      if (!actor || !videoId) return null;
      return actor.getVideoStatus(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
    refetchInterval: (query) => {
      const status = query.state.data;
      if (!status) return false;
      if (status.__kind__ === 'processing' || status.__kind__ === 'uploading') {
        return 2000;
      }
      return false;
    },
  });
}

export function useAnalysisResult(videoId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<VideoAnalysisResult | null>({
    queryKey: ['analysisResult', videoId],
    queryFn: async () => {
      if (!actor || !videoId) return null;
      return actor.getAnalysisResult(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useStoreAnalysisResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, result }: { videoId: string; result: VideoAnalysisResult }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.storeAnalysisResult(videoId, result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analysisResult', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['videoStatus', variables.videoId] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoStatus'] });
      queryClient.invalidateQueries({ queryKey: ['analysisResult'] });
    },
  });
}

export function useCameraMode(videoId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CameraModeData | null>({
    queryKey: ['cameraMode', videoId],
    queryFn: async () => {
      if (!actor || !videoId) return null;
      return actor.getCameraMode(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useUpdateCameraMode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, mode }: { videoId: string; mode: CameraModeData }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateCameraMode(videoId, mode);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cameraMode', variables.videoId] });
    },
  });
}
