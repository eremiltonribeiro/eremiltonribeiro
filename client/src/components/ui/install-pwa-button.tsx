import { useState, useEffect } from 'react';
import { Button } from './button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI to notify the user they can add to home screen
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      // Show the prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Installation error:', error);
    } finally {
      // We no longer need the prompt. Clear it up.
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
    }
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="info"
      size="sm"
      isLoading={isInstalling}
      className="flex items-center gap-1"
      aria-label="Instalar aplicativo"
    >
      {!isInstalling && <Download className="w-4 h-4" />}
      <span>Instalar App</span>
    </Button>
  );
}
