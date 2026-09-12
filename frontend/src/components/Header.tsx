'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, User as UserIcon } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { Language } from '@/lib/translations';
import HelpModal from './HelpModal';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, artisan } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  const langButtons: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADBC8] px-4 py-2.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black text-[#D9531E]">
            <span className="bg-[#D9531E] text-white p-1.5 rounded-xl text-base shadow-xs">🎨</span>
            <span>{t.appTitle}</span>
          </Link>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Pills */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              {langButtons.map((btn) => (
                <button
                  key={btn.code}
                  type="button"
                  onClick={() => setLanguage(btn.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    language === btn.code
                      ? 'bg-[#D9531E] text-white shadow-xs scale-105'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Persistent Help Button */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-[#D9531E] px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold transition active:scale-95"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.help}</span>
            </button>

            {/* Profile / Login Link */}
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold transition active:scale-95"
              >
                <UserIcon className="w-4 h-4 text-[#D9531E]" />
                <span className="max-w-[80px] truncate">{artisan?.name || 'प्रोफ़ाइल'}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 bg-[#D9531E] hover:bg-[#B84214] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs"
              >
                <span>लॉग इन</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
