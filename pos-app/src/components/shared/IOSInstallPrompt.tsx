import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    
    // Show only if on iOS and not yet installed
    if (isIOS && !isStandalone) {
      // Don't show immediately, wait 3 seconds
      const timer = setTimeout(() => {
        const hasSeen = localStorage.getItem("ios-pwa-prompt-seen");
        if (!hasSeen) setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("ios-pwa-prompt-seen", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 relative overflow-hidden">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
            <img src="/favicon.svg" alt="POS" className="w-8 h-8 invert brightness-0" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">Install POS System</h3>
            <p className="text-xs text-gray-500 leading-tight">Install this app on your iPhone for a better experience and offline access.</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-medium text-gray-700">
          <span>Tap</span>
          <div className="p-1 bg-gray-100 rounded-md">
            <Share className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span>then</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded-md">Add to Home Screen</span>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
      </div>
    </div>
  );
}
