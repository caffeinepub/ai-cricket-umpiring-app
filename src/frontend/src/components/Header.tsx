import { Video, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    // Use resolvedTheme to handle "system" theme correctly
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-anime-accent-cyan/20 bg-card/70 backdrop-blur-md sticky top-0 z-50 anime-lights-glow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-anime-accent-pink via-anime-accent-cyan to-anime-accent-yellow flex items-center justify-center shadow-lg anime-lights-glow relative">
              <Video className="w-6 h-6 text-white relative z-10" />
              <Sparkles className="w-3 h-3 text-anime-yellow absolute top-1 right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-anime-accent-pink via-anime-accent-cyan to-anime-accent-yellow bg-clip-text text-transparent">
                MR.AI UMPIRE
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-anime-cyan" />
                Real-Time DRS Analysis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-anime-accent-cyan/10 hover:text-anime-cyan transition-all"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-anime-yellow" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-anime-cyan" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
