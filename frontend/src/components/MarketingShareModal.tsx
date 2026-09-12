'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Share2, Copy, Check, QrCode, MessageSquare, ExternalLink } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { ProductData, StoreData } from '@/lib/api';

interface MarketingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductData | null;
  store?: StoreData | null;
}

export default function MarketingShareModal({
  isOpen,
  onClose,
  product,
  store,
}: MarketingShareModalProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const storeSlug = store?.slug || 'ramesh-warli-art';
  const productSlug = product?.slug || '';
  const productUrl = productSlug
    ? `${origin}/store/${storeSlug}/product/${productSlug}`
    : `${origin}/store/${storeSlug}`;

  const title = product?.title || 'हस्तनिर्मित उत्पादन (Handcrafted Product)';
  const priceStr = product?.price ? `₹${product.price.toLocaleString('en-IN')}` : 'उत्कृष्ट किंमत';
  const craft = product?.craft_type || 'पारंपरिक कला';

  const marketingMessage = {
    mr: `नमस्ते 🙏\n\nहे माझे हाताने बनवलेले "${title}" आहे.\nहे पारंपरिक ${craft} कलेवर आधारित आहे.\n\nकिंमत: ${priceStr}\n\nयेथे पहा आणि खरेदी करा:\n${productUrl}`,
    hi: `नमस्ते 🙏\n\nयह मेरा हाथ से बनाया हुआ "${title}" है।\nयह पारंपरिक ${craft} कला से प्रेरित है।\n\nकीमत: ${priceStr}\n\nदेखें और ऑर्डर करें:\n${productUrl}`,
    en: `Namaste 🙏\n\nCheck out my handcrafted product: "${title}".\nAuthentic ${craft} made with traditional Indian artistry.\n\nPrice: ${priceStr}\n\nView digital catalog:\n${productUrl}`,
  };

  const messageText = marketingMessage[language] || marketingMessage.hi;

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: messageText,
          url: productUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }
    await handleCopyMessage();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#EADBC8] shadow-2xl p-6 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl text-lg font-bold">📢</span>
            <div>
              <h2 className="text-lg font-black">शेयर करने के लिए संदेश</h2>
              <p className="text-xs text-stone-500 font-medium">WhatsApp Marketing Message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
            WhatsApp / Social Media Text
          </label>
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs font-medium text-stone-800 whitespace-pre-line leading-relaxed shadow-inner">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
            <span>📱 WhatsApp पर शेयर करें</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-3 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-300 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
              <span>{copied ? 'Copied!' : '🔗 लिंक कॉपी करें'}</span>
            </button>

            <Link
              href="/dashboard/store/qr"
              onClick={onClose}
              className="py-3 px-3 bg-amber-50 hover:bg-amber-100 text-[#D9531E] font-bold text-xs rounded-xl border border-amber-200 transition flex items-center justify-center gap-1.5 active:scale-95 text-center"
            >
              <QrCode className="w-4 h-4" />
              <span>📱 QR दिखाएं</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
