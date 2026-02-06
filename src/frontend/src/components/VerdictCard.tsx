import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import type { Verdict } from '../backend';

interface VerdictCardProps {
  title: string;
  verdict: Verdict;
  color: 'success' | 'destructive' | 'warning' | 'muted';
}

const colorClasses = {
  success: {
    bg: 'bg-anime-turf/10',
    text: 'text-anime-turf',
    border: 'border-anime-turf/30',
    badge: 'bg-anime-turf/20 text-anime-turf border-anime-turf/40',
    glow: 'shadow-[0_0_20px_oklch(var(--anime-turf)/0.3)]',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    badge: 'bg-destructive/20 text-destructive border-destructive/40',
    glow: 'shadow-[0_0_20px_oklch(var(--destructive)/0.3)]',
  },
  warning: {
    bg: 'bg-anime-accent-yellow/10',
    text: 'text-anime-accent-yellow',
    border: 'border-anime-accent-yellow/30',
    badge: 'bg-anime-accent-yellow/20 text-anime-accent-yellow border-anime-accent-yellow/40',
    glow: 'shadow-[0_0_20px_oklch(var(--anime-accent-yellow)/0.3)]',
  },
  muted: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground border-border',
    glow: '',
  },
};

export default function VerdictCard({ title, verdict, color }: VerdictCardProps) {
  const colors = colorClasses[color];
  const confidencePercent = Math.round(verdict.confidence * 100);

  return (
    <Card className={`${colors.border} ${colors.bg} ${colors.glow} border-2 anime-card-glow transition-all duration-300 hover:scale-105`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base text-foreground flex items-center gap-2">
          <Sparkles className={`w-3 h-3 md:w-4 md:h-4 ${colors.text} flex-shrink-0`} />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Badge variant="outline" className={`${colors.badge} text-base md:text-lg font-bold px-3 py-1`}>
            {verdict.text}
          </Badge>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence</span>
              <span className={`font-semibold ${colors.text}`}>{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-1.5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{verdict.reasoning}</p>
      </CardContent>
    </Card>
  );
}
