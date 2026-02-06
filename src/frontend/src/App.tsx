import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import VideoCapture from './components/VideoCapture';
import AnalysisView from './components/AnalysisView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; videoUrl: string } | null>(null);

  // Cleanup object URLs when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (selectedVideo?.videoUrl) {
        URL.revokeObjectURL(selectedVideo.videoUrl);
      }
    };
  }, [selectedVideo]);

  const handleVideoSelected = (video: { id: string; videoUrl: string }) => {
    // Revoke previous URL if exists
    if (selectedVideo?.videoUrl) {
      URL.revokeObjectURL(selectedVideo.videoUrl);
    }
    setSelectedVideo(video);
  };

  const handleBack = () => {
    // Revoke URL when going back
    if (selectedVideo?.videoUrl) {
      URL.revokeObjectURL(selectedVideo.videoUrl);
    }
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen flex flex-col anime-stadium-bg relative overflow-hidden">
      {/* Anime stadium lights overlay */}
      <div className="fixed inset-0 anime-stadium-lights pointer-events-none z-0" />
      
      {/* Anime field overlay */}
      <div className="fixed inset-0 anime-field-overlay pointer-events-none z-0" />
      
      {/* Motion lines effect */}
      <div className="fixed inset-0 anime-motion-lines pointer-events-none z-0 opacity-30" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {!selectedVideo ? (
            <VideoCapture onVideoSelected={handleVideoSelected} />
          ) : (
            <AnalysisView 
              videoId={selectedVideo.id} 
              videoUrl={selectedVideo.videoUrl}
              onBack={handleBack} 
            />
          )}
        </main>
        <Footer />
      </div>
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
