'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, Phone, MapPin, Palette, Globe, LogOut, Check, RefreshCw } from 'lucide-react';
import { Language } from '@/lib/translations';

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

function ProfileContent() {
  const { artisan, updateProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: artisan?.name || '',
    location: artisan?.location || '',
    state: artisan?.state || '',
    craft_type: artisan?.craft_type || 'Warli Art',
  });

  useEffect(() => {
    if (artisan) {
      setFormData({
        name: artisan.name || '',
        location: artisan.location || '',
        state: artisan.state || '',
        craft_type: artisan.craft_type || 'Warli Art',
      });
    }
  }, [artisan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    try {
      await updateProfile({
        ...formData,
        language,
      });
      setSuccessMsg('प्रोफ़ाइल माहिती जतन केली! (Profile saved successfully!)');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">👤 मेरी प्रोफ़ाइल</h1>
          <p className="text-xs text-stone-500 font-medium">Artisan Account Settings</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-bold transition active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>लॉग आउट</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-[#EADBC8] shadow-sm space-y-4">
        {/* Mobile Number Read-Only */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            मोबाइल नंबर (Mobile Number)
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              disabled
              value={`+91 ${artisan?.phone || ''}`}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-100 border border-stone-200 text-stone-600 font-bold text-sm select-none"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            आपका नाम (Your Name)
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#D9531E]" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold"
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
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold"
            />
          </div>
        </div>

        {/* Craft Type */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            आप कौन सा काम करते हैं? (Craft)
          </label>
          <div className="relative">
            <Palette className="absolute left-3.5 top-3.5 w-4 h-4 text-[#D9531E]" />
            <select
              name="craft_type"
              value={formData.craft_type}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold bg-white cursor-pointer"
            >
              {CRAFT_TYPES.map((craft) => (
                <option key={craft} value={craft}>
                  {craft}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            भाषा (Preferred Language)
          </label>
          <div className="flex gap-2">
            {[
              { code: 'mr' as Language, label: 'मराठी 🇮🇳' },
              { code: 'hi' as Language, label: 'हिंदी 🇮🇳' },
              { code: 'en' as Language, label: 'English 🇬🇧' },
            ].map((btn) => (
              <button
                key={btn.code}
                type="button"
                onClick={() => setLanguage(btn.code)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition ${
                  language === btn.code
                    ? 'bg-[#D9531E] text-white border-[#D9531E]'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#D9531E] hover:bg-[#B84214] text-white font-bold text-sm py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <span>माहिती जतन करा (Save Changes)</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
