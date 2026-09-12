"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Store,
  Users,
  ChevronRight,
  Sparkles,
  Tag,
  ArrowRight,
  Globe,
  QrCode,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Camera,
  FileText,
  Trash2
} from "lucide-react";
import { api, authApi, ProductData, StoreData, EnquiryData, BuyerMatchData } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { hasProductDraft, clearProductDraft } from "@/lib/draftStorage";

function DashboardContent() {
  const { t } = useLanguage();
  const [artisanName, setArtisanName] = useState<string>("Ramesh ji");
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [buyerMatchCounts, setBuyerMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(hasProductDraft());
    async function init() {
      try {
        setLoading(true);
        const [me, prods, st, enqs] = await Promise.all([
          authApi.getMe().catch(() => null),
          authApi.getMyProducts().catch(() => []),
          authApi.getMyStore().catch(() => null),
          authApi.getMyEnquiries().catch(() => [])
        ]);

        if (me) {
          setArtisanName(me.name || "Karigar");
          setArtisanId(me.id || null);
        }
        if (prods) setProducts(prods);
        if (st) setStore(st);
        if (enqs) setEnquiries(enqs);

        // Fetch buyer match counts for each product (replaces hardcoded "4 Buyers")
        if (prods && prods.length > 0) {
          const counts: Record<string, number> = {};
          await Promise.all(
            prods.map(async (p) => {
              try {
                const matches = await api.getBuyerMatches(p.id!).catch(() => [] as BuyerMatchData[]);
                counts[p.id!] = matches.length;
              } catch {
                counts[p.id!] = 0;
              }
            })
          );
          setBuyerMatchCounts(counts);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const getPublicStoreUrl = () => {
    if (!store) return "";
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${origin}/store/${store.slug}`;
  };

  const handleCopyLink = async () => {
    const url = getPublicStoreUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDiscardDraft = () => {
    clearProductDraft();
    setHasDraft(false);
  };

  const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length;

  return (
    <div className="py-2 space-y-6 text-stone-800">
      {/* Draft Recovery Banner */}
      {hasDraft && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-200/70 text-amber-900 rounded-2xl shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                {t.draftRestoredBanner}
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {t.draftRestoredDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <Link
              href="/products/add"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-extrabold rounded-xl transition shadow-2xs"
            >
              {t.resumeDraft}
            </Link>
            <button
              onClick={handleDiscardDraft}
              className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-xl transition"
              title={t.discardDraft}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Artisan Friendly Greeting Banner */}
      <div className="bg-gradient-to-r from-[#D9531E] via-[#E86A38] to-[#F4A261] p-6 sm:p-7 rounded-3xl text-white shadow-lg relative overflow-hidden space-y-4">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> {t.appTitle}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            👋 {t.welcomeGreeting}, {artisanName}!
          </h1>
          <p className="text-sm font-semibold text-amber-100">
            {t.whatToDoToday}
          </p>
        </div>

        {/* Visual Guided Journey Strip */}
        <div className="bg-black/25 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center justify-between overflow-x-auto text-xs font-bold text-amber-100 gap-2 shrink-0">
          <div className="flex items-center gap-1 whitespace-nowrap">📷 Photo</div>
          <span className="opacity-60">→</span>
          <div className="flex items-center gap-1 whitespace-nowrap">🎙 Voice</div>
          <span className="opacity-60">→</span>
          <div className="flex items-center gap-1 whitespace-nowrap">✨ Catalog</div>
          <span className="opacity-60">→</span>
          <div className="flex items-center gap-1 whitespace-nowrap">💰 Price</div>
          <span className="opacity-60">→</span>
          <div className="flex items-center gap-1 whitespace-nowrap">🤝 Buyers</div>
          <span className="opacity-60">→</span>
          <div className="flex items-center gap-1 whitespace-nowrap">🏪 Store</div>
        </div>
      </div>

      {/* Simple Mode Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Sell New Product */}
        <Link
          href="/products/add"
          className="bg-[#D9531E] text-white p-6 rounded-3xl shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-98"
        >
          <div className="space-y-1.5">
            <div className="p-3 bg-white/20 rounded-2xl w-fit">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-extrabold text-xl pt-1">{t.addProductCardTitle}</h3>
            <p className="text-xs text-amber-100 font-medium">{t.addProductCardDesc}</p>
          </div>
          <ChevronRight className="w-7 h-7 transform group-hover:translate-x-1 transition shrink-0" />
        </Link>

        {/* Card 2: My Digital Store */}
        <Link
          href="/dashboard/store"
          className="bg-white p-6 rounded-3xl border-2 border-[#EADBC8] shadow-sm hover:border-[#D9531E] transition-all flex items-center justify-between group active:scale-98"
        >
          <div className="space-y-1.5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl w-fit">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-xl text-stone-900 pt-1">{t.myStoreCardTitle}</h3>
            <p className="text-xs text-stone-500 font-medium">{t.myStoreCardDesc}</p>
          </div>
          <ChevronRight className="w-7 h-7 text-stone-400 group-hover:translate-x-1 transition shrink-0" />
        </Link>

        {/* Card 3: Find Buyers */}
        <Link
          href={products.length > 0 ? `/products/${products[0].id}/matches` : "/products/add"}
          className="bg-white p-6 rounded-3xl border-2 border-[#EADBC8] shadow-sm hover:border-blue-500 transition-all flex items-center justify-between group active:scale-98"
        >
          <div className="space-y-1.5">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl w-fit">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-xl text-stone-900 pt-1">{t.findBuyersCardTitle}</h3>
            <p className="text-xs text-stone-500 font-medium">{t.findBuyersCardDesc}</p>
          </div>
          <ChevronRight className="w-7 h-7 text-stone-400 group-hover:translate-x-1 transition shrink-0" />
        </Link>

        {/* Card 4: Customer Messages / Enquiries */}
        <Link
          href="/dashboard/enquiries"
          className="bg-white p-6 rounded-3xl border-2 border-[#EADBC8] shadow-sm hover:border-amber-500 transition-all flex items-center justify-between group active:scale-98"
        >
          <div className="space-y-1.5">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl w-fit relative">
              <MessageSquare className="w-7 h-7" />
              {newEnquiriesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white" />
              )}
            </div>
            <h3 className="font-extrabold text-xl text-stone-900 pt-1">{t.messagesCardTitle}</h3>
            <p className="text-xs text-stone-500 font-medium">
              {newEnquiriesCount > 0 ? `${newEnquiriesCount} new messages` : t.messagesCardDesc}
            </p>
          </div>
          <ChevronRight className="w-7 h-7 text-stone-400 group-hover:translate-x-1 transition shrink-0" />
        </Link>
      </div>

      {/* Quick Digital Store Banner */}
      {store && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-amber-50 p-5 rounded-3xl shadow-sm border border-amber-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">🏪 {t.myStore}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                {t.liveOnline}
              </span>
            </div>
            <p className="text-base font-extrabold text-amber-100">
              {store.store_name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <ExternalLink className="w-4 h-4" /> {t.openStore}
            </Link>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-amber-900/80 border border-amber-600/40 text-amber-100 text-xs font-semibold hover:bg-amber-800 transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? t.linkCopied : t.copyLink}
            </button>

            <Link
              href="/dashboard/store/qr"
              className="px-3.5 py-2.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-white transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" /> {t.showQR}
            </Link>
          </div>
        </div>
      )}

      {/* Active Products List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D9531E]" /> {t.activeProductsTitle}
          </h2>
          {products.length > 0 && (
            <Link href="/products/add" className="text-xs font-bold text-[#D9531E] hover:underline flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> {t.addProduct}
            </Link>
          )}
        </div>

        {/* Empathetic Empty State */}
        {products.length === 0 && !loading && (
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#D9531E]/40 text-center space-y-4 bg-[#FAF8F5]">
            <div className="w-16 h-16 bg-orange-100 text-[#D9531E] rounded-3xl flex items-center justify-center mx-auto shadow-inner text-2xl">
              📷
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-lg font-extrabold text-stone-900">{t.noProductsTitle}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{t.noProductsDesc}</p>
            </div>
            <Link
              href="/products/add"
              className="inline-flex items-center justify-center gap-2 bg-[#D9531E] hover:bg-[#B84214] text-white font-extrabold text-base py-3.5 px-6 rounded-2xl shadow-md transition active:scale-95"
            >
              {t.addFirstProductBtn}
            </Link>
          </div>
        )}

        {/* Product Cards */}
        {products.length > 0 && (
          <div className="space-y-3">
            {products.map((prod) => {
              const matchCount = buyerMatchCounts[prod.id!] ?? 0;
              const hasPhoto = !!prod.original_image || !!prod.processed_image;
              const hasCatalog = !!prod.description && prod.description.length > 10;
              const hasPrice = !!prod.price || !!prod.suggested_price;
              const hasBuyers = matchCount > 0;
              const isPublished = store?.is_public !== false;

              return (
                <div
                  key={prod.id}
                  className="bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-lg text-stone-900">{prod.title}</h4>
                      <p className="text-xs text-stone-500 font-medium">
                        {prod.craft_type} • {prod.price ? `₹${prod.price}` : t.aiPriceGuidance}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                      ✓ {t.statusAiCatalogReady}
                    </span>
                  </div>

                  {/* Product Status Tracker */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EADBC8] space-y-2">
                    <p className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wide">
                      {t.productStatusTitle}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className={`px-2.5 py-1 rounded-full border ${hasPhoto ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                        {hasPhoto ? '✓' : '○'} {t.statusPhotoAdded}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border ${hasCatalog ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                        {hasCatalog ? '✓' : '○'} {t.statusAiCatalogReady}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border ${hasPrice ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                        {hasPrice ? '✓' : '○'} {t.statusPriceReady}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border ${hasBuyers ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                        {hasBuyers ? '✓' : '○'} {t.statusBuyersReady}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border ${isPublished ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                        {isPublished ? '✓' : '○'} {t.statusStorePublished}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <div className="bg-orange-50 text-[#D9531E] border border-orange-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {prod.price ? `✓ ₹${prod.price}` : t.aiPriceGuidance}
                    </div>

                    <div className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      🎯 {matchCount} {t.findBuyersCardTitle}
                    </div>

                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      {t.liveOnline}
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-xs font-bold text-center">
                    <Link
                      href={`/products/${prod.id}/catalog`}
                      className="py-2.5 bg-stone-100 text-stone-800 rounded-xl hover:bg-stone-200 transition"
                    >
                      {t.aiCatalogTitle}
                    </Link>
                    <Link
                      href={`/products/${prod.id}/pricing`}
                      className="py-2.5 bg-orange-50 text-[#D9531E] rounded-xl hover:bg-orange-100 transition border border-orange-200"
                    >
                      {t.aiPriceGuidance}
                    </Link>
                    <Link
                      href={`/products/${prod.id}/matches`}
                      className="py-2.5 bg-blue-50 text-blue-800 rounded-xl hover:bg-blue-100 transition border border-blue-200"
                    >
                      {t.findBuyersCardTitle}
                    </Link>
                    {store && (
                      <Link
                        href={`/store/${store.slug}/product/${prod.slug || prod.id}`}
                        target="_blank"
                        className="py-2.5 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        {t.openStore} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
