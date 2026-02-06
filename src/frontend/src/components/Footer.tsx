import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-anime-accent-pink/20 bg-card/50 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2025. Built with{' '}
          <Heart className="inline w-4 h-4 text-anime-accent-pink fill-anime-accent-pink animate-pulse" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-anime-accent-cyan hover:text-anime-accent-pink transition-colors font-medium"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}

