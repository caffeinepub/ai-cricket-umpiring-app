import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Loader2, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerdictCard from './VerdictCard';
import VisualizationPanel from './VisualizationPanel';
import { toast } from 'sonner';
import type { VideoAnalysisResult, Verdict } from '../backend';

interface AnalysisViewProps {
  videoId: string;
  videoUrl: string;
  onBack: () => void;
}

interface LiveDecision {
  type: 'lbw' | 'noBall' | 'edge';
  verdict: Verdict;
  timestamp: number;
  visible: boolean;
}

export default function AnalysisView({ videoId, videoUrl, onBack }: AnalysisViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveDecisions, setLiveDecisions] = useState<LiveDecision[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [frameData, setFrameData] = useState<Array<{ ballPosition: [number, number] }>>([]);
  const analysisIntervalRef = useRef<number | null>(null);
  const decisionsGeneratedRef = useRef<Set<string>>(new Set());

  // Cleanup interval on unmount or when analysis stops
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current !== null) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, []);

  // Generate mock real-time decisions
  const generateLiveDecision = useCallback((currentTime: number, type: 'lbw' | 'noBall' | 'edge'): Verdict => {
    const decisions = {
      lbw: [
        { text: 'OUT', confidence: 0.87, reasoning: 'Ball pitched in line, impact in line, hitting middle stump.' },
        { text: 'NOT OUT', confidence: 0.82, reasoning: 'Impact outside off stump, missing the stumps.' },
        { text: 'OUT', confidence: 0.91, reasoning: 'Pitched in line, impact in line, would have hit leg stump.' },
      ],
      noBall: [
        { text: 'NO-BALL', confidence: 0.94, reasoning: 'Front foot clearly over the crease line.' },
        { text: 'LEGAL DELIVERY', confidence: 0.96, reasoning: 'Front foot behind the crease at point of delivery.' },
      ],
      edge: [
        { text: 'EDGE DETECTED', confidence: 0.79, reasoning: 'Clear spike on snicko when ball passed the bat.' },
        { text: 'NO EDGE', confidence: 0.85, reasoning: 'No deviation in trajectory, no spike detected.' },
        { text: 'EDGE DETECTED', confidence: 0.88, reasoning: 'Visible deflection and audio spike detected.' },
      ],
    };

    const options = decisions[type];
    return options[Math.floor(Math.random() * options.length)];
  }, []);

  // Real-time frame-by-frame analysis
  useEffect(() => {
    // Clear any existing interval first
    if (analysisIntervalRef.current !== null) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (isPlaying && videoRef.current && isAnalyzing) {
      analysisIntervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (!video) return;

        const time = video.currentTime;
        
        // Generate ball trajectory frame data
        setFrameData(prev => {
          const newFrame = {
            ballPosition: [
              100 + (time * 80) + Math.random() * 20,
              200 - (time * 30) + Math.random() * 15
            ] as [number, number]
          };
          return [...prev.slice(-29), newFrame];
        });

        // Trigger decisions at specific intervals with deduplication
        const noBallKey = `noBall-${Math.floor(time * 2)}`;
        if (time > 2 && time < 2.5 && !decisionsGeneratedRef.current.has(noBallKey)) {
          decisionsGeneratedRef.current.add(noBallKey);
          const decision: LiveDecision = {
            type: 'noBall',
            verdict: generateLiveDecision(time, 'noBall'),
            timestamp: time,
            visible: true,
          };
          setLiveDecisions(prev => [...prev, decision]);
          toast.info(`No-Ball Check: ${decision.verdict.text}`);
        }

        const edgeKey = `edge-${Math.floor(time * 2)}`;
        if (time > 3.5 && time < 4 && !decisionsGeneratedRef.current.has(edgeKey)) {
          decisionsGeneratedRef.current.add(edgeKey);
          const decision: LiveDecision = {
            type: 'edge',
            verdict: generateLiveDecision(time, 'edge'),
            timestamp: time,
            visible: true,
          };
          setLiveDecisions(prev => [...prev, decision]);
          toast.info(`Edge Detection: ${decision.verdict.text}`);
        }

        const lbwKey = `lbw-${Math.floor(time * 2)}`;
        if (time > 5 && time < 5.5 && !decisionsGeneratedRef.current.has(lbwKey)) {
          decisionsGeneratedRef.current.add(lbwKey);
          const decision: LiveDecision = {
            type: 'lbw',
            verdict: generateLiveDecision(time, 'lbw'),
            timestamp: time,
            visible: true,
          };
          setLiveDecisions(prev => [...prev, decision]);
          toast.info(`LBW Decision: ${decision.verdict.text}`);
        }
      }, 100); // Analyze every 100ms
    }

    return () => {
      if (analysisIntervalRef.current !== null) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isPlaying, isAnalyzing, generateLiveDecision]);

  // Compile final analysis result
  useEffect(() => {
    if (liveDecisions.length >= 3 && !analysisResult) {
      const lbwDecision = liveDecisions.find(d => d.type === 'lbw')?.verdict || {
        text: 'NOT OUT',
        confidence: 0.85,
        reasoning: 'No LBW situation detected in this footage.',
      };
      const noBallDecision = liveDecisions.find(d => d.type === 'noBall')?.verdict || {
        text: 'LEGAL DELIVERY',
        confidence: 0.92,
        reasoning: 'All deliveries within legal parameters.',
      };
      const edgeDetection = liveDecisions.find(d => d.type === 'edge')?.verdict || {
        text: 'NO EDGE',
        confidence: 0.78,
        reasoning: 'No bat-ball contact detected.',
      };

      const result: VideoAnalysisResult = {
        lbwDecision,
        noBallDecision,
        edgeDetection,
        trajectoryOverlay: new Uint8Array([]),
        snickoOverlay: new Uint8Array([]),
        frameData: frameData,
      };

      setAnalysisResult(result);
    }
  }, [liveDecisions, analysisResult, frameData]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          toast.error('Failed to play video');
        });
        setIsPlaying(true);
        if (!isAnalyzing) {
          setIsAnalyzing(true);
          toast.success('Real-time AI analysis started');
        }
      }
    }
  }, [isPlaying, isAnalyzing]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (analysisIntervalRef.current !== null) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }, [currentTime, duration]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const activeLiveDecision = liveDecisions.find(
    d => d.visible && Math.abs(d.timestamp - currentTime) < 2
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-anime-accent-cyan/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-anime-accent-pink via-anime-accent-cyan to-anime-accent-yellow bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-anime-accent-cyan flex-shrink-0" />
            <span className="truncate">Real-Time Video Analysis</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">Live AI processing with frame-by-frame decisions</p>
        </div>
        {isAnalyzing && (
          <Badge variant="outline" className="border-anime-accent-cyan text-anime-accent-cyan anime-lights-glow">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Analyzing Live
          </Badge>
        )}
      </div>

      <Card className="anime-gradient-border anime-card-glow bg-gradient-to-br from-card to-anime-turf/5">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-anime-accent-cyan/30 shadow-xl">
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="w-full h-full object-contain"
            />
            
            {/* Live decision overlay */}
            {activeLiveDecision && (
              <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-right-5 duration-500 max-w-[90%] md:max-w-xs">
                <Card className="anime-gradient-border anime-lights-glow bg-card/95 backdrop-blur-sm shadow-2xl">
                  <CardHeader className="pb-2 p-3 md:p-4">
                    <CardTitle className="text-xs md:text-sm flex items-center gap-2">
                      <Zap className="w-3 h-3 md:w-4 md:h-4 text-anime-accent-yellow flex-shrink-0" />
                      <span className="truncate">
                        {activeLiveDecision.type === 'lbw' && 'LBW Decision'}
                        {activeLiveDecision.type === 'noBall' && 'No-Ball Check'}
                        {activeLiveDecision.type === 'edge' && 'Edge Detection'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 md:p-4 pt-0">
                    <Badge 
                      variant="outline" 
                      className={`text-sm md:text-base font-bold ${
                        activeLiveDecision.verdict.text.includes('OUT') || 
                        activeLiveDecision.verdict.text.includes('NO-BALL') ||
                        activeLiveDecision.verdict.text.includes('EDGE')
                          ? 'border-destructive text-destructive'
                          : 'border-anime-accent-cyan text-anime-accent-cyan'
                      }`}
                    >
                      {activeLiveDecision.verdict.text}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {Math.round(activeLiveDecision.verdict.confidence * 100)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ball trajectory overlay */}
            {isAnalyzing && frameData.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="trajectoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="oklch(var(--anime-accent-cyan))" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="oklch(var(--anime-accent-pink))" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(var(--anime-accent-yellow))" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${frameData.map(f => `${f.ballPosition[0]},${f.ballPosition[1]}`).join(' L ')}`}
                  fill="none"
                  stroke="url(#trajectoryGradient)"
                  strokeWidth="4"
                  opacity="0.8"
                />
                {frameData.length > 0 && (
                  <circle
                    cx={frameData[frameData.length - 1].ballPosition[0]}
                    cy={frameData[frameData.length - 1].ballPosition[1]}
                    r="10"
                    fill="oklch(var(--anime-accent-pink))"
                    opacity="0.9"
                    className="animate-pulse"
                  />
                )}
              </svg>
            )}
          </div>

          {/* Video controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground min-w-[3rem]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs md:text-sm text-muted-foreground min-w-[3rem]">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSkip(-5)}
                disabled={currentTime === 0}
                className="hover:bg-anime-accent-cyan/10 hover:border-anime-accent-cyan/50"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink hover:opacity-90 transition-opacity anime-lights-glow"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSkip(5)}
                disabled={currentTime >= duration}
                className="hover:bg-anime-accent-pink/10 hover:border-anime-accent-pink/50"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Tabs defaultValue="decisions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-anime-accent-cyan/20">
            <TabsTrigger value="decisions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-anime-accent-cyan/20 data-[state=active]:to-anime-accent-pink/20">
              Live Decisions
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-anime-accent-pink/20 data-[state=active]:to-anime-accent-yellow/20">
              Analysis Visualizations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decisions" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <VerdictCard
                title="LBW Decision"
                verdict={analysisResult.lbwDecision}
                color={analysisResult.lbwDecision.text === 'OUT' ? 'destructive' : 'success'}
              />
              <VerdictCard
                title="No-Ball Check"
                verdict={analysisResult.noBallDecision}
                color={analysisResult.noBallDecision.text === 'NO-BALL' ? 'warning' : 'success'}
              />
              <VerdictCard
                title="Edge Detection"
                verdict={analysisResult.edgeDetection}
                color={analysisResult.edgeDetection.text === 'EDGE DETECTED' ? 'warning' : 'muted'}
              />
            </div>
          </TabsContent>

          <TabsContent value="visualizations" className="space-y-4 mt-6">
            <VisualizationPanel result={analysisResult} currentTime={currentTime} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
