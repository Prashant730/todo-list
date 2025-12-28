import { useState } from 'react';
import { FiDownload, FiX, FiSmartphone, FiWifi, FiWifiOff } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isOnline: _isOnline, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage to remember user preference
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FiSmartphone className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Install Study Planner
            </h3>
            <p className="text-xs text-blue-100 mb-3">
              Add to your home screen for quick access and offline support!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 rounded text-xs font-medium hover:bg-blue-50 transition"
              >
                <FiDownload size={14} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-blue-100 hover:text-white text-xs transition"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-100 hover:text-white transition"
            aria-label="Dismiss install banner"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <FiWifiOff size={16} />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = usePWA();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  // Show "back online" message briefly when connection is restored
  useState(() => {
    if (isOnline) {
      setShowOnlineMessage(true);
      const timer = setTimeout(() => setShowOnlineMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOnlineMessage || !isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
        <FiWifi size={16} />
        <span className="text-sm font-medium">Back online!</span>
      </div>
    </div>
  );
}