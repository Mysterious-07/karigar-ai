"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Palette, ArrowRight, Loader2, Sparkles, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Language } from "@/lib/translations";

const CRAFT_TYPES = [
  "Warli Art",
  "Madhubani Painting",
  "Pottery & Ceramics",
  "Terracotta & Clay Art",
  "Banarasi & Handloom Weaving",
  "Wood Carving & Handicrafts",
  "Brass & Metalware",
  "Embroidery & Zardozi",
  "Leather Crafts",
  "Bamboo & Cane Craft",
  "Other Indian Crafts"
];

function OnboardingContent() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { artisan, updateProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: artisan?.name && artisan.name !== "Artisan" ? artisan.name : "",
    location: artisan?.location || "",
    state: artisan?.state || "Maharashtra",
    craft_type: artisan?.craft_type || "Warli Art",
  });

  useEffect(() => {
    if (artisan) {
      setFormData((prev) => ({
        ...prev,
        name: artisan.name && artisan.name !== "Artisan" ? artisan.name : prev.name,
        location: artisan.location || prev.location,
        state: artisan.state || prev.state,
        craft_type: artisan.craft_type || prev.craft_type,
      }));
    }
  }, [artisan]);

  const languageOptions: { code: Language; nativeName: string; flag: string }[] = [
    { code: "mr", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "hi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "en", nativeName: "English", flag: "🇬🇧" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProfile({
        ...formData,
        language: language,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4 max-w-md mx-auto space-y-6 text-stone-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#D9531E] to-[#F4A261] p-6 rounded-3xl text-white shadow-md text-center space-y-3">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-xl shadow-inner">
          🎨
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-black">आपके बारे में थोड़ा बताएं</h1>
          <p className="text-xs text-amber-100 font-medium">(Tell us a little about yourself)</p>
        </div>

        {/* Language Selection */}
        <div className="pt-2">
          <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            <Globe className="w-3.5 h-3.5" /> भाषा (Language)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`py-2 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  language === lang.code
                    ? "bg-white text-[#D9531E] shadow-md scale-105"
                    : "bg-black/20 text-white hover:bg-black/30"
                }`}
              >
                <span>{lang.flag} {lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl text-center">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-[#EADBC8] shadow-sm">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            आपका नाम (Your Name)
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-[#D9531E]" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ramesh"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-base font-semibold"
            />
          </div>
        </div>

        {/* Location & State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              शहर / गांव (City/Village)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Palghar"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              राज्य (State)
            </label>
            <input
              type="text"
              name="state"
              required
              value={formData.state}
              onChange={handleChange}
              placeholder="Maharashtra"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold"
            />
          </div>
        </div>

        {/* Craft Type */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            आप कौन सा काम करते हैं? (Your Craft)
          </label>
          <div className="relative">
            <Palette className="absolute left-3.5 top-3.5 w-5 h-5 text-[#D9531E]" />
            <select
              name="craft_type"
              value={formData.craft_type}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-base font-semibold bg-white cursor-pointer"
            >
              {CRAFT_TYPES.map((craft) => (
                <option key={craft} value={craft}>
                  {craft}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 bg-[#D9531E] hover:bg-[#B84214] text-white text-base font-bold py-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>शुरू करें (Get Started)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function Onboarding() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
