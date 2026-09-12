'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Trash2, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptChange: (text: string) => void;
  language: string; // 'en' | 'hi' | 'mr'
  initialTranscript?: string;
}

export default function VoiceRecorder({
  onTranscriptChange,
  language,
  initialTranscript = '',
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Map language code to BCP 47 locale
  const getLocale = (langCode: string) => {
    switch (langCode) {
      case 'mr':
        return 'mr-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const getLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'mr':
        return 'मराठी (Marathi)';
      case 'hi':
        return 'हिंदी (Hindi)';
      case 'en':
      default:
        return 'English';
    }
  };

  useEffect(() => {
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  useEffect(() => {
    // Check browser Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLocale(language);

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        onTranscriptChange(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning/error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access is not allowed or blocked. You can allow it in your browser address bar, or simply type your product description below.');
        } else if (event.error === 'no-speech') {
          setErrorMessage("We couldn't hear anything. Please try again or type your description.");
        } else {
          setErrorMessage(`Voice input note (${event.error}). You can type your description directly.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [language]);

  const startRecording = () => {
    if (!isSupported) {
      setErrorMessage('Voice input is not supported in this browser. Please type your description instead.');
      return;
    }

    if (recognitionRef.current) {
      try {
        setErrorMessage(null);
        recognitionRef.current.lang = getLocale(language);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setIsRecording(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClear = () => {
    setTranscript('');
    onTranscriptChange('');
  };

  return (
    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#D9531E]/30 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#D9531E] flex items-center justify-center font-bold">
            🎙
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Tell us about your product by voice</h3>
            <p className="text-xs text-gray-500">Speaking in {getLanguageName(language)}</p>
          </div>
        </div>

        {transcript && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Voice
          </button>
        )}
      </div>

      {/* Mic Button & Status Area */}
      <div className="text-center py-4 bg-white rounded-xl border border-stone-200 space-y-3 shadow-2xs">
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-md focus:outline-hidden ${
            isRecording
              ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-100 scale-105'
              : 'bg-[#D9531E] text-white hover:bg-[#B84214] hover:scale-105'
          }`}
        >
          {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
        </button>

        <div>
          <div className="text-sm font-bold text-gray-800">
            {isRecording ? (
              <span className="text-red-600 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                Listening... Speak naturally in {getLanguageName(language)}
              </span>
            ) : (
              <span>Tap microphone to start speaking</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isRecording ? 'Tap button again when finished speaking' : 'Your words will transcribe live into text below'}
          </p>
        </div>
      </div>

      {/* Unsupported or Error Alert */}
      {!isSupported && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Voice input is not available in this browser. You can type your description below.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
