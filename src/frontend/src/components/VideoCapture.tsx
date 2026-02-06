import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Upload, Video, Play, StopCircle, AlertCircle, Sparkles, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCamera } from '../camera/useCamera';
import { toast } from 'sonner';

interface VideoCaptureProps {
  onVideoSelected: (video: { id: string; videoUrl: string }) => void;
}

type CameraMode = 'standard' | 'wide';

export default function VideoCapture({ onVideoSelected }: VideoCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('standard');
  const [isSwitching, setIsSwitching] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Determine camera configuration based on mode
  const cameraConfig = cameraMode === 'wide' 
    ? {
        facingMode: 'environment' as const,
        width: 2560,
        height: 1080,
      }
    : {
        facingMode: 'environment' as const,
        width: 1920,
        height: 1080,
      };
  
  const { 
    isActive, 
    isSupported, 
    error: cameraError, 
    isLoading,
    startCamera, 
    stopCamera,
    videoRef, 
    canvasRef 
  } = useCamera(cameraConfig);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Error stopping recorder on unmount:', e);
        }
      }
      if (isActive) {
        stopCamera();
      }
    };
  }, [isActive, isRecording, stopCamera]);

  const handleStartCamera = async () => {
    setCaptureMode('camera');
    const success = await startCamera();
    if (!success) {
      toast.error('Failed to start camera. Please check permissions.');
    }
  };

  const handleToggleCameraMode = async () => {
    if (isSwitching || isRecording) return;
    
    setIsSwitching(true);
    const newMode: CameraMode = cameraMode === 'standard' ? 'wide' : 'standard';
    
    try {
      // Stop current camera
      if (isActive) {
        await stopCamera();
      }
      
      // Update mode
      setCameraMode(newMode);
      
      // Show toast
      toast.success(`Switched to ${newMode === 'wide' ? 'Wide-Angle' : 'Standard'} mode`);
      
      // Restart camera with new settings after a brief delay
      await new Promise(resolve => setTimeout(resolve, 300));
      await startCamera();
    } catch (error) {
      console.error('Error switching camera mode:', error);
      toast.error('Failed to switch camera mode');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleStartRecording = useCallback(() => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Camera not ready');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    
    // Check for supported mime types
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    if (!selectedMimeType) {
      toast.error('Video recording not supported on this device');
      return;
    }
    
    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType });
        const videoUrl = URL.createObjectURL(blob);
        const recordingId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Clean up
        recordedChunksRef.current = [];
        stopCamera();
        
        onVideoSelected({ id: recordingId, videoUrl });
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error occurred');
        setIsRecording(false);
        recordedChunksRef.current = [];
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to start recording');
      recordedChunksRef.current = [];
    }
  }, [videoRef, stopCamera, onVideoSelected]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast.success('Recording stopped');
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast.error('Failed to stop recording');
      }
    }
  }, [isRecording]);

  const handleCancel = useCallback(() => {
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } catch (e) {
        console.error('Error stopping recording:', e);
      }
    }
    
    // Stop camera
    if (isActive) {
      stopCamera();
    }
    
    // Reset state
    setCaptureMode(null);
    recordedChunksRef.current = [];
  }, [isRecording, isActive, stopCamera]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload MP4, MOV, AVI, or WebM files.');
        return;
      }

      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 100MB.');
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      const uploadId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      onVideoSelected({ id: uploadId, videoUrl });
      toast.success('Video loaded successfully!');
    },
    [onVideoSelected]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4 relative">
        {/* Decorative anime elements */}
        <div className="absolute -top-8 left-1/4 w-32 h-32 opacity-10 pointer-events-none hidden md:block">
          <img src="/assets/generated/cricket-ball-flight.dim_400x300.png" alt="" className="w-full h-full object-contain animate-bounce" />
        </div>
        <div className="absolute -top-8 right-1/4 w-24 h-32 opacity-10 pointer-events-none hidden md:block">
          <img src="/assets/generated/cricket-umpire.dim_300x400.png" alt="" className="w-full h-full object-contain anime-banner-wave" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-anime-accent-pink via-anime-accent-cyan to-anime-accent-yellow bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-anime-accent-pink animate-pulse" />
          MR.AI UMPIRE
          <Zap className="w-6 h-6 md:w-8 md:h-8 text-anime-accent-yellow animate-pulse" />
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Capture live cricket action or upload videos for instant AI-powered DRS analysis with frame-by-frame decision making.
        </p>
      </div>

      {!captureMode && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="anime-card-glow cursor-pointer group transition-all duration-300 overflow-hidden relative"
            onClick={handleStartCamera}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-anime-accent-cyan/5 to-anime-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-anime-accent-cyan" />
                <span className="bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink bg-clip-text text-transparent">
                  Live Camera
                </span>
              </CardTitle>
              <CardDescription>
                Record cricket action in real-time with your device camera
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="aspect-video bg-gradient-to-br from-anime-turf/20 to-anime-accent-cyan/20 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform border border-anime-accent-cyan/20">
                <Video className="w-16 h-16 text-anime-accent-cyan/60" />
                <Sparkles className="w-6 h-6 text-anime-accent-pink absolute top-4 right-4 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="anime-card-glow cursor-pointer group transition-all duration-300 overflow-hidden relative"
            onClick={() => setCaptureMode('upload')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-anime-accent-pink/5 to-anime-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-anime-accent-pink" />
                <span className="bg-gradient-to-r from-anime-accent-pink to-anime-accent-yellow bg-clip-text text-transparent">
                  Upload Video
                </span>
              </CardTitle>
              <CardDescription>
                Select a cricket video from your device gallery
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="aspect-video bg-gradient-to-br from-anime-accent-pink/20 to-anime-accent-yellow/20 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform border border-anime-accent-pink/20">
                <Upload className="w-16 h-16 text-anime-accent-pink/60" />
                <Zap className="w-6 h-6 text-anime-accent-yellow absolute top-4 right-4 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {captureMode === 'camera' && (
        <div className={`transition-all duration-500 ease-in-out ${isActive ? 'camera-fullscreen-container' : ''}`}>
          <Card className={`anime-gradient-border anime-card-glow transition-all duration-500 ${isActive ? 'camera-fullscreen-card' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-anime-accent-cyan" />
                  <span className="bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink bg-clip-text text-transparent">
                    Live Camera Feed
                  </span>
                  <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-1 rounded-full bg-anime-accent-cyan/10 border border-anime-accent-cyan/20">
                    {cameraMode === 'wide' ? 'Wide-Angle Mode' : 'Standard Mode'}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="hover:bg-anime-accent-pink/10">
                  Cancel
                </Button>
              </CardTitle>
              <CardDescription>
                Position your camera to capture the cricket action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cameraError && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {cameraError.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className={`relative bg-black rounded-lg overflow-hidden border-2 transition-all duration-500 camera-preview-glow ${
                cameraMode === 'wide' 
                  ? 'camera-wide-view border-anime-accent-yellow/40' 
                  : 'aspect-video border-anime-accent-cyan/30'
              } shadow-lg`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    cameraMode === 'wide' ? 'camera-wide-video' : ''
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera Mode Indicator */}
                <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 ${
                  cameraMode === 'wide' 
                    ? 'bg-gradient-to-r from-anime-accent-yellow to-anime-accent-pink text-white anime-lights-glow' 
                    : 'bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink text-white anime-lights-glow'
                }`}>
                  {cameraMode === 'wide' ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {cameraMode === 'wide' ? 'Wide-Angle' : 'Standard'}
                  </span>
                </div>
                
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-destructive to-anime-accent-pink text-white px-3 py-1.5 rounded-full shadow-lg anime-lights-glow">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}

                {/* Aspect Ratio Guide Overlay for Wide Mode */}
                {cameraMode === 'wide' && isActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-anime-accent-yellow/20 rounded-lg" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-anime-accent-yellow/10" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-anime-accent-yellow/10" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                {!isActive && !isLoading && (
                  <Button onClick={handleStartCamera} className="bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink hover:opacity-90 transition-opacity">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                
                {isActive && (
                  <>
                    <Button 
                      onClick={handleToggleCameraMode} 
                      variant="outline"
                      disabled={isRecording || isSwitching}
                      className={`border-2 transition-all duration-300 ${
                        cameraMode === 'wide' 
                          ? 'border-anime-accent-yellow/50 text-anime-accent-yellow hover:bg-anime-accent-yellow/10' 
                          : 'border-anime-accent-cyan/50 text-anime-accent-cyan hover:bg-anime-accent-cyan/10'
                      }`}
                    >
                      {cameraMode === 'wide' ? (
                        <>
                          <Minimize2 className="w-4 h-4 mr-2" />
                          Switch to Standard
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4 mr-2" />
                          Switch to Wide
                        </>
                      )}
                    </Button>

                    {!isRecording && (
                      <Button onClick={handleStartRecording} className="bg-gradient-to-r from-destructive to-anime-accent-pink hover:opacity-90 transition-opacity">
                        <Play className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    
                    {isRecording && (
                      <Button onClick={handleStopRecording} variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all">
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Camera Mode Info */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border transition-all duration-300 ${
                  cameraMode === 'standard' 
                    ? 'bg-anime-accent-cyan/10 border-anime-accent-cyan/30 anime-card-glow' 
                    : 'bg-muted/50 border-border/50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Minimize2 className="w-4 h-4 text-anime-accent-cyan" />
                    <span className="font-medium text-sm">Standard Mode</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    16:9 aspect ratio • 1920x1080 • Best for close-up action
                  </p>
                </div>
                <div className={`p-3 rounded-lg border transition-all duration-300 ${
                  cameraMode === 'wide' 
                    ? 'bg-anime-accent-yellow/10 border-anime-accent-yellow/30 anime-card-glow' 
                    : 'bg-muted/50 border-border/50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Maximize2 className="w-4 h-4 text-anime-accent-yellow" />
                    <span className="font-medium text-sm">Wide-Angle Mode</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    21:9 aspect ratio • 2560x1080 • Captures full field view
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {captureMode === 'upload' && (
        <Card className="anime-gradient-border anime-card-glow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-anime-accent-pink" />
                <span className="bg-gradient-to-r from-anime-accent-pink to-anime-accent-yellow bg-clip-text text-transparent">
                  Upload Video File
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCaptureMode(null)} className="hover:bg-anime-accent-pink/10">
                Cancel
              </Button>
            </CardTitle>
            <CardDescription>
              Select a cricket video from your device (MP4, MOV, AVI, WebM • Max 100MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="cricket-upload-zone relative rounded-2xl p-12 text-center transition-all duration-300 overflow-hidden">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-4 relative z-0">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-anime-accent-pink/30 via-anime-accent-cyan/30 to-anime-accent-yellow/30 flex items-center justify-center shadow-lg anime-lights-glow">
                  <Upload className="w-10 h-10 text-anime-accent-cyan" />
                </div>
                <div>
                  <p className="text-xl font-semibold bg-gradient-to-r from-anime-accent-pink to-anime-accent-cyan bg-clip-text text-transparent">
                    Click to browse files
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">or drag and drop your video here</p>
                  <p className="text-xs text-anime-accent-pink font-medium mt-3 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    MP4, MOV, AVI, WebM • Max 100MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="anime-card-glow bg-gradient-to-br from-card to-anime-turf/5 transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-anime-accent-cyan" />
              Real-Time LBW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Live ball trajectory analysis with instant impact point detection and decision prompts.
            </p>
          </CardContent>
        </Card>
        <Card className="anime-card-glow bg-gradient-to-br from-card to-anime-accent-pink/5 transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-anime-accent-pink" />
              Live No-Ball Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Frame-by-frame front-foot analysis with immediate illegal delivery alerts.
            </p>
          </CardContent>
        </Card>
        <Card className="anime-card-glow bg-gradient-to-br from-card to-anime-accent-yellow/5 transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-anime-accent-yellow" />
              Instant Edge Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Real-time snicko visualization with synchronized bat-ball contact detection.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-gradient-to-r from-anime-accent-cyan/10 to-anime-accent-pink/10 border-anime-accent-cyan/30 anime-card-glow">
        <AlertCircle className="h-4 w-4 text-anime-accent-cyan" />
        <AlertDescription className="text-sm">
          <strong>Note:</strong> This is a simulated real-time AI analysis system. The frontend generates frame-by-frame decisions during video playback to demonstrate live DRS capabilities. Wide-angle mode provides enhanced field coverage for comprehensive match analysis.
        </AlertDescription>
      </Alert>
    </div>
  );
}
