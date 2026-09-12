'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Globe,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowLeft,
  ShoppingBag,
  Plus,
  Share2
} from 'lucide-react';
import { api, authApi, StoreData, ProductData, getImageUrl } from '@/lib/api';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function StoreManageContent() {
  const { t } = useLanguage();
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [togglingStore, setTogglingStore] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [storeRes, productsRes] = await Promise.all([
          authApi.getMyStore(),
          authApi.getMyProducts()
        ]);
        setStore(storeRes);
        setProducts(productsRes);
        setArtisanId(storeRes.artisan_id);
      } catch (err) {
        console.error('Failed to load store data:', err);
        // No fallback to demo store — show error state instead
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadStoreAndProducts(id: string): Promise<boolean> {
    try {
      setLoading(true);
      const [storeRes, productsRes] = await Promise.all([
        api.getArtisanStore(id),
        api.getArtisanProducts(id)
      ]);
      setStore(storeRes);
      setProducts(productsRes);
      return true;
    } catch (err: any) {
      console.error(err);
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

  const handleShareStore = async () => {
    const url = getPublicStoreUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: store?.store_name || t.myStore,
          text: `Check out my digital craft store on Karigar AI!`,
          url: url,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }
    await handleCopyLink();
  };

  const handleToggleStorePublic = async () => {
    if (!store || !store.id) return;
    try {
      setTogglingStore(true);
      const updated = await api.updateStore(store.id, { is_public: !store.is_public });
      setStore(updated);
    } catch (err: any) {
      alert(t.errorGeneric);
    } finally {
      setTogglingStore(false);
    }
  };

  const handleToggleProductPublic = async (productId: string, currentPublic: boolean) => {
    if (!store || !store.id) return;
    try {
      await api.toggleStoreProductVisibility(store.id, productId, !currentPublic);
      if (artisanId) {
        const updatedProducts = await api.getArtisanProducts(artisanId);
        setProducts(updatedProducts);
      }
    } catch (err: any) {
      alert(t.errorGeneric);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#D9531E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-stone-700">{t.myStore}</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto">
          <Store className="w-8 h-8 text-stone-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-stone-800">{t.errorGeneric}</h2>
          <p className="text-xs text-stone-500">{t.tryAgain}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-extrabold rounded-2xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t.dashboard}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6 text-stone-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2.5 bg-white rounded-2xl border border-[#EADBC8] text-stone-700 hover:bg-stone-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-[#D9531E]" /> {t.myStore}
            </h1>
            <p className="text-xs text-stone-500 font-medium">{t.myStoreCardDesc}</p>
          </div>
        </div>

        {store && (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> {t.openStore}
          </Link>
        )}
      </div>

      {/* Store Banner Card */}
      {store && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-amber-50 p-6 sm:p-7 rounded-3xl shadow-lg space-y-5 border border-amber-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-700/40 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${store.is_public ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-stone-700/60 text-stone-300'}`}>
                  {store.is_public ? t.liveOnline : t.privateStore}
                </span>
                <span className="text-xs text-amber-300/80 font-mono">/store/{store.slug}</span>
              </div>
              <h2 className="text-2xl font-black text-amber-100">{store.store_name}</h2>
              <p className="text-xs text-amber-200/80 mt-1 max-w-xl font-medium">{store.description}</p>
            </div>

            <button
              onClick={handleToggleStorePublic}
              disabled={togglingStore}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition active:scale-95 ${store.is_public
                ? 'bg-amber-900/80 border-amber-600 text-amber-100 hover:bg-amber-800'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                }`}
            >
              {togglingStore ? 'Updating...' : store.is_public ? 'Make Private' : 'Publish Store'}
            </button>
          </div>

          {/* Quick Sharing Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 bg-black/40 p-2.5 px-4 rounded-2xl border border-amber-500/20 max-w-md overflow-hidden">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-100 font-mono truncate">{getPublicStoreUrl()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareStore}
                className="px-4 py-2.5 rounded-2xl bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs active:scale-95"
              >
                <Share2 className="w-4 h-4" /> {t.shareStore}
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-2xl bg-amber-900/80 border border-amber-600/40 text-amber-100 text-xs font-bold hover:bg-amber-800 transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? t.linkCopied : t.copyLink}
              </button>

              <Link
                href="/dashboard/store/qr"
                className="px-3.5 py-2.5 rounded-2xl bg-amber-100 text-amber-900 text-xs font-extrabold hover:bg-white transition flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" /> {t.showQR}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Product Visibility Controls */}
      <section className="bg-white p-6 rounded-3xl border border-[#EADBC8] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D9531E]" /> {t.activeProductsTitle}
            </h3>
            <p className="text-xs text-stone-500 font-medium">{t.myStoreCardDesc}</p>
          </div>

          <Link
            href="/products/add"
            className="px-4 py-2 rounded-2xl bg-[#D9531E] text-white text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t.addProduct}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-stone-200 rounded-3xl p-6 bg-[#FAF8F5]">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-extrabold text-stone-700">{t.noProductsTitle}</p>
            <Link href="/products/add" className="text-xs text-[#D9531E] font-bold underline mt-1 inline-block">
              {t.addFirstProductBtn}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const isProductPublic = product.is_public !== false;

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getImageUrl(product.processed_image || product.original_image)}
                      alt={product.title}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-art.jpg';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-stone-900 truncate">{product.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isProductPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                          {isProductPublic ? t.liveOnline : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                        {product.craft_type} • ₹{product.price || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleProductPublic(product.id!, isProductPublic)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 ${isProductPublic
                      ? 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                      : 'bg-[#D9531E] text-white border-[#D9531E] hover:bg-[#B84214]'
                      }`}
                  >
                    {isProductPublic ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-stone-500" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Show
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function StoreManagePage() {
  return (
    <ProtectedRoute>
      <StoreManageContent />
    </ProtectedRoute>
  );
}
