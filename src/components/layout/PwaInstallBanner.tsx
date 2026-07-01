"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function PwaInstallBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { updateAvailable, promptUpdate } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (updateAvailable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal text-ivory p-4 shadow-lg md:bottom-auto md:top-16">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm">A new version is available.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={promptUpdate}
              className="bg-gold text-charcoal px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors"
            >
              Update
            </button>
            <button onClick={() => setDismissed(true)} className="p-2 hover:bg-white/10 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal text-ivory p-4 shadow-lg md:bottom-auto md:top-16">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-gold flex-shrink-0" />
          <p className="text-sm">Install HAINJU for a faster shopping experience.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={promptInstall}
            className="bg-gold text-charcoal px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Install
          </button>
          <button onClick={() => setDismissed(true)} className="p-2 hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
