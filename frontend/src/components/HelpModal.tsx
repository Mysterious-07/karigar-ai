'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Store, Users, MessageSquare, Settings, HelpCircle, PhoneCall, Mic, MicOff, Volume2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import Link from 'next/link';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Voice help: map spoken keywords to help topics
  const helpTopics = [
    {
      id: 'addProduct',
      label: t.helpTopicAddProduct,
      answer: t.helpTopicAddProductAnswer,
      keywords: ['product', 'उत्पाद', 'उत्पादन', 'बेचें', 'जोड़ें', 'जोडा', 'add', 'new', 'नया', 'नवे'],
      href: '/products/add',
    },
    {
      id: 'changePrice',
      label: t.helpTopicChangePrice,
      answer: t.helpTopicChangePriceAnswer,
      keywords: ['price', 'कीमत', 'किंमत', 'मूल्य', 'change', 'बदल', 'बदला'],
      href: null,
    },
    {
      id: 'shareShop',
      label: t.helpTopicShareShop,
      answer: t.helpTopicShareShopAnswer,
      keywords: ['share', 'शेयर', 'शेअर', 'shop', 'दुकान', 'store', 'QR'],
      href: '/dashboard/store',
    },
    {
      id: 'contactBuyer',
      label: t.helpTopicContactBuyer,
      answer: t.helpTopicContactBuyerAnswer,
      keywords: ['buyer', 'खरीदार', 'खरेदीदार', 'contact', 'संपर्क', 'buyers'],
      href: null,
    },
  ];

  // Initialize speech recognition for voice help
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice help event:', event.error);
        setVoiceError(t.voiceHelpUnsupported);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to init voice help:', err);
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, language, t]);

  const handleVoiceCommand = (transcript: string) => {
    // Find matching help topic based on keywords
    for (const topic of helpTopics) {
      const match = topic.keywords.some((kw) => transcript.includes(kw.toLowerCase()));
      if (match) {
        setActiveAnswer(topic.id);
        // Speak the answer
        speakText(topic.answer);
        return;
      }
    }
    // Default: speak the first topic
    setActiveAnswer('addProduct');
    speakText(helpTopics[0].answer);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting voice help:', err);
      }
    }
  };

  const handleTopicClick = (topic: any) => {
    setActiveAnswer(topic.id);
    speakText(topic.answer);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 border border-[#EADBC8] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#D9531E] flex items-center justify-center font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">{t.helpModalTitle}</h3>
              <p className="text-xs text-gray-500">{t.helpModalDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Help Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#D9531E]" /> {t.voiceHelpTitle}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{t.voiceHelpDesc}</p>
            </div>
            {voiceSupported ? (
              <button
                type="button"
                onClick={handleToggleListen}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-100'
                    : 'bg-[#D9531E] text-white hover:bg-[#B84214] hover:scale-105'
                  }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            ) : (
              <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-3 py-1.5 rounded-xl">
                {t.voiceHelpUnsupported}
              </span>
            )}
          </div>
          {isListening && (
            <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              {t.listening}
            </p>
          )}
          {voiceError && (
            <p className="text-xs text-red-600 font-semibold">{voiceError}</p>
          )}
        </div>

        {/* Help Topics with Answers */}
        <div className="space-y-3">
          {helpTopics.map((topic) => (
            <div key={topic.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleTopicClick(topic)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition text-gray-900 font-bold text-sm text-left ${activeAnswer === topic.id
                    ? 'bg-orange-100 border-orange-300'
                    : 'bg-orange-50 hover:bg-orange-100/80 border-orange-200/80'
                  }`}
              >
                <div className="p-2 bg-[#D9531E] text-white rounded-xl shrink-0">
                  {topic.id === 'addProduct' && <Camera className="w-5 h-5" />}
                  {topic.id === 'changePrice' && <Settings className="w-5 h-5" />}
                  {topic.id === 'shareShop' && <Store className="w-5 h-5" />}
                  {topic.id === 'contactBuyer' && <Users className="w-5 h-5" />}
                </div>
                <span className="flex-1">{topic.label}</span>
                <Volume2 className="w-4 h-4 text-[#D9531E] shrink-0" />
              </button>

              {activeAnswer === topic.id && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-stone-700 leading-relaxed font-medium">
                  {topic.answer}
                  {topic.href && (
                    <Link
                      href={topic.href}
                      onClick={onClose}
                      className="block mt-2 text-[#D9531E] font-extrabold hover:underline"
                    >
                      → {t.helpAddProduct}
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Support Banner */}
        <div className="p-3.5 bg-stone-100 rounded-2xl text-xs text-stone-600 text-center flex items-center justify-center gap-2">
          <PhoneCall className="w-4 h-4 text-[#D9531E]" />
          <span>{t.supportBannerText}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-2xl transition text-sm"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
}