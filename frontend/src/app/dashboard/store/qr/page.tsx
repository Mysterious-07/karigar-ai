'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Copy, Check, QrCode, Sparkles, ExternalLink, Printer, Store, Package, Tent } from 'lucide-react';
import { api, authApi, StoreData, ArtisanData } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';

function StoreQRContent() {
  const { t } = useLanguage();
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function init() {
      await loadData();
    }
    init();
  }, []);

  async function loadData(): Promise<boolean> {
    try {
      setLoading(true);
      const [artisanRes, storeRes] = await Promise.all([
        authApi.getMe(),
        authApi.getMyStore()
      ]);
      setArtisan(artisanRes);
      setStore(storeRes);
      setArtisanId(artisanRes.id || null);

      // Generate QR Code Data URL client side
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const storeUrl = `${origin}/store/${storeRes.slug}`;

      const dataUrl = await QRCode.toDataURL(storeUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#3b1800',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
      return true;
    } catch (err: any) {
      console.error('Failed to load QR code data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }

  const getPublicStoreUrl = () => {
    if (!store) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${origin}/store/${store.slug}`;
  };

  const handleCopyLink = async () => {
    const url = getPublicStoreUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !store) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${store.slug}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">Generating digital storefront QR code...</p>
        </div>
      </div>
    );
  }

  if (!store || !artisan) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm max-w-sm space-y-4">
          <QrCode className="w-10 h-10 text-amber-700 mx-auto" />
          <h2 className="font-serif font-bold text-stone-800">{t.storefrontNotFound}</h2>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold">
            {t.returnToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/store" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-700" /> {t.qrPageTitle}
              </h1>
              <p className="text-xs text-stone-500">{t.qrPageDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> {t.printBtn}
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> {t.downloadQR}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-10 space-y-8">
        {/* Printable Card */}
        <div className="bg-gradient-to-b from-amber-900 via-amber-800 to-stone-950 text-amber-50 p-8 sm:p-10 rounded-3xl shadow-xl border-2 border-amber-600/30 text-center space-y-6 relative overflow-hidden">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 text-amber-500/20 text-xs font-serif font-bold">KARIGAR AI</div>
          <div className="absolute bottom-3 right-3 text-amber-500/20 text-xs font-serif font-bold">KARIGAR AI</div>

          {/* Header Info */}
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-amber-100 uppercase">
              {artisan.name}
            </h2>
            <p className="text-sm font-medium text-amber-200/90 tracking-wide uppercase">
              {artisan.craft_type} • {artisan.location}, {artisan.state}
            </p>
            <p className="text-xs text-amber-300/80 pt-1 italic">
              {t.scanQR}
            </p>
          </div>

          {/* QR Code Container Box */}
          <div className="bg-white p-6 rounded-2xl border-4 border-amber-500/40 inline-block shadow-2xl mx-auto my-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code for ${store.store_name}`} className="w-56 h-56 mx-auto rounded-lg" />
            ) : (
              <div className="w-56 h-56 bg-stone-200 rounded-lg animate-pulse"></div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="pt-4 border-t border-amber-700/50 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-200 font-semibold bg-stone-950/60 px-4 py-1.5 rounded-full border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.craftedWith}</span>
            </div>
            <p className="text-[11px] text-amber-300/70 font-mono tracking-tight">{getPublicStoreUrl()}</p>
          </div>
        </div>

        {/* QR Usage Placement Tips */}
        <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 shadow-2xs space-y-3 print:hidden">
          <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" /> Where to use this QR Code
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-900 font-medium">
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center gap-2">
              <span>{t.qrPlacementTip1}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center gap-2">
              <span>{t.qrPlacementTip2}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center gap-2">
              <span>{t.qrPlacementTip3}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Box */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 print:hidden">
          <h3 className="font-serif font-bold text-sm text-stone-800">{t.quickSharingActions}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
              {copied ? t.storeUrlCopied : t.copyStoreUrl}
            </button>

            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-700" /> {t.testOpenStore}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StoreQRPage() {
  return (
    <ProtectedRoute>
      <StoreQRContent />
    </ProtectedRoute>
  );
}
