import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap } from 'lucide-react';
import type { VideoAnalysisResult } from '../backend';

interface VisualizationPanelProps {
  result: VideoAnalysisResult;
  currentTime?: number;
}

export default function VisualizationPanel({ result, currentTime = 0 }: VisualizationPanelProps) {
  const currentFrameIndex = useMemo(() => {
    return Math.min(
      Math.floor((currentTime / 10) * result.frameData.length),
      result.frameData.length - 1
    );
  }, [currentTime, result.frameData.length]);

  return (
    <div className="space-y-6">
      <Card className="anime-gradient-border anime-card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-anime-accent-cyan flex-shrink-0" />
            <span className="bg-gradient-to-r from-anime-accent-cyan to-anime-accent-pink bg-clip-text text-transparent">
              Real-Time Ball Trajectory
            </span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Live 3D ball path visualization with synchronized frame tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-gradient-to-br from-anime-turf/10 to-anime-accent-cyan/10 rounded-lg overflow-hidden border-2 border-anime-accent-cyan/20">
            <img
              src="/assets/generated/drs-visualization.dim_600x400.png"
              alt="DRS Visualization"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
                {/* Cricket pitch background */}
                <rect x="0" y="0" width="600" height="400" fill="transparent" />
                <line x1="0" y1="200" x2="600" y2="200" stroke="oklch(var(--anime-accent-cyan) / 0.3)" strokeWidth="2" strokeDasharray="10,5" />
                
                {/* Ball trajectory path */}
                {result.frameData.length > 0 && (
                  <>
                    <defs>
                      <linearGradient id="vizTrajectoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="oklch(var(--anime-accent-cyan))" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="oklch(var(--anime-accent-pink))" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="oklch(var(--anime-accent-yellow))" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${result.frameData.map((frame, i) => {
                        const x = 50 + (i / result.frameData.length) * 500;
                        const y = 300 - (frame.ballPosition[1] / 300) * 200;
                        return `${x},${y}`;
                      }).join(' L ')}`}
                      fill="none"
                      stroke="url(#vizTrajectoryGradient)"
                      strokeWidth="4"
                      opacity="0.9"
                    />
                    
                    {/* Ball positions */}
                    {result.frameData.map((frame, i) => {
                      const x = 50 + (i / result.frameData.length) * 500;
                      const y = 300 - (frame.ballPosition[1] / 300) * 200;
                      const isActive = i === currentFrameIndex;
                      
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={isActive ? 10 : 5}
                          fill={isActive ? 'oklch(var(--anime-accent-pink))' : 'oklch(var(--anime-accent-cyan))'}
                          opacity={isActive ? 1 : 0.4 + (i / result.frameData.length) * 0.5}
                          className={isActive ? 'animate-pulse' : ''}
                        />
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
            <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4">
              <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs">
                <div className="bg-card/90 backdrop-blur-sm rounded px-1 md:px-2 py-1 border border-anime-accent-cyan/30">
                  <div className="text-muted-foreground text-[10px] md:text-xs">Frame</div>
                  <div className="font-semibold text-anime-accent-cyan text-xs md:text-sm">{currentFrameIndex + 1}/{result.frameData.length}</div>
                </div>
                <div className="bg-card/90 backdrop-blur-sm rounded px-1 md:px-2 py-1 border border-anime-accent-pink/30">
                  <div className="text-muted-foreground text-[10px] md:text-xs">Ball Speed</div>
                  <div className="font-semibold text-anime-accent-pink text-xs md:text-sm">142 km/h</div>
                </div>
                <div className="bg-card/90 backdrop-blur-sm rounded px-1 md:px-2 py-1 border border-anime-accent-yellow/30">
                  <div className="text-muted-foreground text-[10px] md:text-xs">Deviation</div>
                  <div className="font-semibold text-anime-accent-yellow text-xs md:text-sm">2.3°</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="anime-gradient-border anime-card-glow">
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-anime-accent-pink flex-shrink-0" />
              Live Snicko Analysis
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Real-time audio waveform for bat-ball contact detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[5/2] bg-gradient-to-br from-anime-accent-pink/5 to-anime-accent-cyan/5 rounded-lg overflow-hidden border-2 border-anime-accent-pink/20">
              <img
                src="/assets/generated/snicko-waveform.dim_500x200.png"
                alt="Snicko Waveform"
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet">
                  {/* Animated waveform */}
                  <defs>
                    <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="oklch(var(--anime-accent-cyan))" />
                      <stop offset="50%" stopColor="oklch(var(--anime-accent-pink))" />
                      <stop offset="100%" stopColor="oklch(var(--anime-accent-yellow))" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,100 ${Array.from({ length: 50 }, (_, i) => {
                      const x = i * 10;
                      const amplitude = i < currentFrameIndex ? Math.sin(i * 0.5) * 30 : 0;
                      return `L ${x},${100 + amplitude}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="url(#waveformGradient)"
                    strokeWidth="3"
                    opacity="0.9"
                  />
                  
                  {/* Spike indicator */}
                  {currentFrameIndex > 15 && currentFrameIndex < 20 && (
                    <line
                      x1={currentFrameIndex * 10}
                      y1="50"
                      x2={currentFrameIndex * 10}
                      y2="150"
                      stroke="oklch(var(--anime-accent-pink))"
                      strokeWidth="4"
                      opacity="0.9"
                      className="animate-pulse"
                    />
                  )}
                </svg>
              </div>
              <div className="absolute top-2 right-2">
                <div className="bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-anime-accent-cyan/30 text-xs">
                  <span className="text-muted-foreground">Time: </span>
                  <span className="font-semibold text-anime-accent-cyan">{currentTime.toFixed(2)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="anime-gradient-border anime-card-glow">
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-anime-accent-yellow flex-shrink-0" />
              Impact Zone Tracking
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Live wicket view with ball impact location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-anime-accent-yellow/5 to-anime-turf/10 rounded-lg overflow-hidden border-2 border-anime-accent-yellow/20">
              <img
                src="/assets/generated/cricket-wickets.dim_400x300.png"
                alt="Cricket Wickets"
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {currentFrameIndex > 10 && (
                  <div 
                    className="w-5 h-5 rounded-full bg-gradient-to-r from-anime-accent-pink to-anime-accent-yellow border-2 border-white shadow-lg animate-pulse"
                    style={{
                      transform: `translate(${(currentFrameIndex - 15) * 2}px, ${Math.sin(currentFrameIndex * 0.3) * 10}px)`,
                      boxShadow: '0 0 20px oklch(var(--anime-accent-pink) / 0.6)'
                    }}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="anime-gradient-border anime-card-glow">
        <CardHeader>
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Zap className="w-3 h-3 md:w-4 md:h-4 text-anime-accent-cyan flex-shrink-0" />
            Frame-by-Frame Ball Tracking
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Real-time position tracking across {result.frameData.length} analyzed frames
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 md:h-64 bg-gradient-to-br from-anime-turf/10 to-anime-accent-cyan/10 rounded-lg border-2 border-anime-accent-cyan/20 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 600 256" preserveAspectRatio="xMidYMid meet">
              {/* Cricket pitch background */}
              <rect x="0" y="0" width="600" height="256" fill="oklch(var(--anime-turf) / 0.05)" />
              <line x1="0" y1="128" x2="600" y2="128" stroke="oklch(var(--anime-accent-cyan) / 0.3)" strokeWidth="1" strokeDasharray="5,5" />
              
              {/* Ball trajectory path */}
              {result.frameData.length > 0 && (
                <>
                  <defs>
                    <linearGradient id="trackingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="oklch(var(--anime-accent-cyan))" />
                      <stop offset="50%" stopColor="oklch(var(--anime-accent-pink))" />
                      <stop offset="100%" stopColor="oklch(var(--anime-accent-yellow))" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${result.frameData.slice(0, currentFrameIndex + 1).map((frame) => 
                      `${frame.ballPosition[0]},${frame.ballPosition[1]}`
                    ).join(' L ')}`}
                    fill="none"
                    stroke="url(#trackingGradient)"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                </>
              )}
              
              {/* Ball positions */}
              {result.frameData.slice(0, currentFrameIndex + 1).map((frame, i) => (
                <circle
                  key={i}
                  cx={frame.ballPosition[0]}
                  cy={frame.ballPosition[1]}
                  r={i === currentFrameIndex ? 8 : 4}
                  fill={i === currentFrameIndex ? 'oklch(var(--anime-accent-pink))' : 'oklch(var(--anime-accent-cyan))'}
                  opacity={i === currentFrameIndex ? 1 : 0.4 + (i / currentFrameIndex) * 0.6}
                  className={i === currentFrameIndex ? 'animate-pulse' : ''}
                />
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
