'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Phone, 
  User, 
  ShoppingBag,
  Filter,
  Check,
  Share2
} from 'lucide-react';
import { api, authApi, EnquiryData, getImageUrl } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';

function EnquiriesDashboardContent() {
  const { t } = useLanguage();
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');

  useEffect(() => {
    loadEnquiries();
  }, []);

  async function loadEnquiries() {
    try {
      setLoading(true);
      const res = await authApi.getMyEnquiries();
      setEnquiries(res);
    } catch (err: any) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkContacted = async (enquiryId: string) => {
    try {
      const updated = await api.updateEnquiryStatus(enquiryId, 'contacted');
      setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? updated : e)));
    } catch (err: any) {
      alert(err.message || 'Failed to update enquiry status');
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    if (filter === 'new') return e.status === 'new';
    if (filter === 'contacted') return e.status === 'contacted';
    return true;
  });

  const newCount = enquiries.filter((e) => e.status === 'new').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">Loading customer enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-700" /> {t.enquiriesTitle}
              </h1>
              <p className="text-xs text-stone-500">{t.enquiriesSubtitle}</p>
            </div>
          </div>

          {newCount > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-full uppercase">
              {newCount} {t.newEnquiriesCount}
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Filter Strip */}
        <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-semibold text-stone-600">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {t.filterAll} ({enquiries.length})
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'new' ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {t.filterNew} ({enquiries.filter(e => e.status === 'new').length})
            </button>
            <button
              onClick={() => setFilter('contacted')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'contacted' ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {t.filterContacted} ({enquiries.filter(e => e.status === 'contacted').length})
            </button>
          </div>
        </div>

        {/* Enquiries List */}
        {filteredEnquiries.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-lg">{t.noEnquiriesTitle}</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {filter !== 'all' ? t.noFilterMatch : t.noEnquiriesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => {
              const isNew = enquiry.status === 'new';
              const dateStr = new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const cleanPhone = enquiry.visitor_contact ? enquiry.visitor_contact.replace(/[^0-9]/g, '') : '';
              const whatsappUrl = cleanPhone 
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Namaste ${enquiry.visitor_name || 'Customer'}, thank you for inquiring about ${enquiry.product_title || 'my craft'} on Karigar AI!`)}`
                : null;

              return (
                <div
                  key={enquiry.id}
                  className={`bg-white p-6 rounded-2xl border transition-all ${
                    isNew ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-sm' : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      {enquiry.product_image && (
                        <img
                          src={getImageUrl(enquiry.product_image)}
                          alt={enquiry.product_title || 'Product'}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-art.jpg';
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isNew ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-green-100 text-green-800'
                          }`}>
                            {isNew ? t.newBadge : t.contactedBadgeLabel}
                          </span>
                          <span className="text-xs text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {dateStr}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-stone-900 mt-1">
                          {t.enquiryProduct}: {enquiry.product_title || 'Handcrafted Product'}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (isNew) handleMarkContacted(enquiry.id);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          💬 WhatsApp
                        </a>
                      )}

                      {isNew && (
                        <button
                          onClick={() => handleMarkContacted(enquiry.id)}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Check className="w-4 h-4" /> {t.markContacted}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visitor Contact & Message Content */}
                  <div className="pt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <span className="flex items-center gap-1.5 font-medium text-stone-800">
                        <User className="w-3.5 h-3.5 text-amber-700" />
                        {enquiry.visitor_name || 'Anonymous Visitor'}
                      </span>
                      {enquiry.visitor_contact && (
                        <span className="flex items-center gap-1.5 font-mono text-stone-700 border-l border-stone-200 pl-4">
                          <Phone className="w-3.5 h-3.5 text-amber-700" />
                          {enquiry.visitor_contact}
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-stone-800 leading-relaxed font-sans">
                      "{enquiry.message}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function EnquiriesDashboardPage() {
  return (
    <ProtectedRoute>
      <EnquiriesDashboardContent />
    </ProtectedRoute>
  );
}
