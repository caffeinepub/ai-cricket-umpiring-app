import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface VideoAnalysisResult {
    edgeDetection: Verdict;
    frameData: Array<TrajectoryFrame>;
    snickoOverlay: Uint8Array;
    trajectoryOverlay: Uint8Array;
    noBallDecision: Verdict;
    lbwDecision: Verdict;
}
export interface WideSettings {
    stabilization: boolean;
    frameRate: bigint;
    lensCorrection: boolean;
    resolution: [bigint, bigint];
    wideAngleMultiplier: number;
    aspectRatio: [bigint, bigint];
}
export interface VideoUpload {
    id: string;
    analysisResult?: VideoAnalysisResult;
    processingStatus: ProcessingStatus;
    videoBlob: ExternalBlob;
    cameraMode: CameraModeData;
}
export interface StandardSettings {
    stabilization: boolean;
    frameRate: bigint;
    resolution: [bigint, bigint];
    aspectRatio: [bigint, bigint];
}
export interface TrajectoryFrame {
    ballPosition: [number, number];
}
export interface CameraModeData {
    wideSettings: WideSettings;
    fieldOfView: bigint;
    standardSettings: StandardSettings;
    activeMode: CameraModeType;
}
export interface Verdict {
    text: string;
    reasoning: string;
    confidence: number;
}
export type ProcessingStatus = {
    __kind__: "completed";
    completed: {
        result: VideoAnalysisResult;
    };
} | {
    __kind__: "uploading";
    uploading: {
        progress: bigint;
    };
} | {
    __kind__: "processing";
    processing: null;
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export enum CameraModeType {
    wide = "wide",
    standard = "standard"
}
export interface backendInterface {
    deleteVideo(videoId: string): Promise<string>;
    filterVideosByMode(mode: CameraModeType): Promise<Array<VideoUpload>>;
    getAllVideos(): Promise<Array<VideoUpload>>;
    getAnalysisResult(videoId: string): Promise<VideoAnalysisResult | null>;
    getCameraMode(videoId: string): Promise<CameraModeData | null>;
    getVideoStatus(videoId: string): Promise<ProcessingStatus | null>;
    storeAnalysisResult(videoId: string, result: VideoAnalysisResult): Promise<string>;
    updateCameraMode(videoId: string, newMode: CameraModeData): Promise<string>;
    uploadVideo(id: string, videoBlob: ExternalBlob): Promise<string>;
}
