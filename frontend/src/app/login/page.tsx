'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { authApi } from '@/lib/api';
import { Phone, KeyRound, Sparkles, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { loginWithOtp } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.trim().length < 10) {
      setError('कृपया वैध १० अंकी मोबाइल नंबर टाका (Please enter a valid 10-digit mobile number)');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(phone);
      setDevOtp(res.dev_otp || '123456');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'OTP पाठवताना त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.trim().length !== 6) {
      setError('कृपया ६ अंकी OTP टाका (Please enter 6-digit OTP)');
      return;
    }

    setLoading(true);
    try {
      const { is_new_user } = await loginWithOtp(phone, otp);
      if (is_new_user) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'अवैध OTP code. कृपया पुन्हा प्रयत्न करा (Demo OTP: 123456)');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoRamesh = () => {
    setPhone('9876543210');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      {/* Header Branding */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#D9531E] to-amber-500 text-white rounded-2xl shadow-md mb-1">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Karigar <span className="text-[#D9531E]">AI</span>
        </h1>
        <p className="text-sm font-semibold text-stone-600">
          आपका डिजिटल व्यवसाय (Your Digital Business Manager)
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center text-xs space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-center gap-1.5 font-bold text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>SIH DEMO MODE</span>
        </div>
        <p className="text-amber-800 font-medium">
          Universal Demo OTP: <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-300">123456</span>
        </p>
        <button
          type="button"
          onClick={handleFillDemoRamesh}
          className="text-xs text-[#D9531E] font-bold underline hover:text-[#B84214] mt-1"
        >
          Auto-fill Demo Artisan Ramesh (9876543210)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-[#EADBC8] p-6 shadow-sm space-y-5">
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                मोबाइल नंबर (Mobile Number)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-stone-500 font-bold text-sm select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-14 pr-4 py-3.5 bg-stone-50 border border-stone-300 rounded-2xl font-bold text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E] focus:bg-white transition"
                  required
                />
                <Phone className="absolute right-3.5 w-5 h-5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D9531E] hover:bg-[#B84214] text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>आगे बढ़ें (Send OTP)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1 text-center">
              <p className="text-xs font-bold text-stone-500 uppercase">
                OTP भेजा गया (OTP Sent to +91 {phone})
              </p>
              {devOtp && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg inline-block">
                  DEMO OTP: <span className="font-mono font-bold text-sm">{devOtp}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider text-center">
                ६ अंकी OTP टाका (Enter 6-Digit OTP)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3.5 text-center tracking-[0.5em] font-mono font-bold text-xl bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E] focus:bg-white transition"
                  required
                />
                <KeyRound className="absolute right-3.5 w-5 h-5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>

            <div className="flex justify-between items-center text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-stone-500 hover:text-stone-800"
              >
                ← बदल करा (Change Number)
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[#D9531E] hover:underline"
              >
                फिर से भेजें (Resend OTP)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
