'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const { language } = useLanguage();

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      setDismissed(false);
    }
    function handleOffline() {
      setIsOffline(true);
      setDismissed(false);
    }

    if (typeof window !== 'undefined') {
      if (!navigator.onLine) {
        setIsOffline(true);
      }
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  if (!isOffline || dismissed) return null;

  const content = {
    mr: {
      title: '⚠️ इंटरनेट कनेक्शन नाही',
      message: 'आपली माहिती या फोनमध्ये सुरक्षित आहे. इंटरनेट आल्यावर आपण पुन्हा कार्य करू शकता.',
      btn: 'ठीक आहे',
    },
    hi: {
      title: '⚠️ इंटरनेट कनेक्शन नहीं है',
      message: 'आपकी जानकारी इस फोन में सुरक्षित है। इंटरनेट आने पर आप फिर से उत्पाद तैयार कर सकते हैं।',
      btn: 'ठीक है',
    },
    en: {
      title: '⚠️ No Internet Connection',
      message: 'Your draft data is safely saved on this phone. You can resume creating products once internet returns.',
      btn: 'OK',
    },
  };

  const text = content[language] || content.hi;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-bounce-short">
      <div className="bg-amber-900 text-amber-50 p-4 rounded-3xl shadow-2xl border-2 border-amber-600 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
            <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
            <span>{text.title}</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-800 rounded-lg text-amber-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-amber-100 font-medium leading-relaxed">
          {text.message}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-[11px] text-amber-300/80">
            <ShieldCheck className="w-3.5 h-3.5" /> Data Saved Locally
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-1.5 bg-amber-50 text-amber-950 hover:bg-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            {text.btn}
          </button>
        </div>
      </div>
    </div>
  );
}
