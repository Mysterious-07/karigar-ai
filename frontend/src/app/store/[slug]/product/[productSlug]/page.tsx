'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Maximize2, 
  Tag, 
  User, 
  X,
  MessageSquare,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { api, PublicStoreData, PublicProductItem, getImageUrl } from '@/lib/api';

export default function PublicProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const productSlug = params.productSlug as string;

  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [product, setProduct] = useState<PublicProductItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Visitor Enquiry Modal state
  const [showEnquiryModal, setShowEnquiryModal] = useState<boolean>(false);
  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorContact, setVisitorContact] = useState<string>('');
  const [message, setMessage] = useState<string>('I am interested in ordering this product.');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [enquirySuccess, setEnquirySuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [storeRes, productRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicProduct(slug, productSlug)
        ]);
        setStore(storeRes);
        setProduct(productRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    if (slug && productSlug) {
      loadData();
    }
  }, [slug, productSlug]);



  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'Handcrafted Product',
          text: `Check out ${product?.title} by ${store?.artisan_name}`,
          url: url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !message.trim()) return;

    try {
      setSubmitting(true);
      await api.sendPublicEnquiry(product.id, {
        product_id: product.id,
        visitor_name: visitorName || undefined,
        visitor_contact: visitorContact || undefined,
        message: message.trim(),
      });
      setEnquirySuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to send enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-stone-600">Loading handcrafted creation...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !store) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-xl font-serif font-bold text-stone-800">Product Not Available</h2>
          <p className="text-sm text-stone-500">{error || 'This product might have been moved or is not public.'}</p>
          <Link
            href={`/store/${slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Digital Storefront
          </Link>
        </div>
      </div>
    );
  }

  const minPrice = product.suggested_min_price || product.price || 0;
  const maxPrice = product.suggested_max_price || (minPrice ? minPrice * 1.25 : 0);

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 font-sans pb-20">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-30 bg-amber-900/95 backdrop-blur-md text-amber-100 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={`/store/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Storefront: {store.artisan_name}
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800/80 border border-amber-600/40 text-amber-100 text-xs font-medium hover:bg-amber-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied' : 'Share'}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Product Image Section */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm aspect-4/3 sm:aspect-square">
              <img
                src={getImageUrl(product.processed_image || product.original_image)}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder-art.jpg';
                }}
              />
              <div className="absolute top-4 left-4 bg-amber-900/90 text-amber-100 text-xs px-3 py-1 rounded-full font-medium shadow-sm backdrop-blur-xs">
                {product.craft_type}
              </div>
            </div>

            {/* AI Verification Badge */}
            <div className="p-4 rounded-xl bg-amber-100/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Verified AI Price Guidance</span>
                <p className="text-amber-800/90 mt-0.5">
                  Fair price estimated using material quality, labor hours, and artisan skill parameters.
                </p>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-amber-700 tracking-wide uppercase">
                {product.category || 'Handcrafted Artwork'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                {product.title}
              </h1>
            </div>

            {/* Price Display */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                AI Suggested Price Range
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-950">
                ₹{minPrice.toLocaleString('en-IN')}
                {maxPrice > minPrice && ` – ₹${Math.round(maxPrice).toLocaleString('en-IN')}`}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                {product.description || 'Authentic handcrafted piece crafted with traditional expertise.'}
              </p>
            </div>

            {/* Craft Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {product.material && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <span className="text-stone-400 font-medium flex items-center gap-1 mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-700" /> Material
                  </span>
                  <span className="font-bold text-stone-800">{product.material}</span>
                </div>
              )}

              {product.dimensions && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <span className="text-stone-400 font-medium flex items-center gap-1 mb-1">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-700" /> Dimensions
                  </span>
                  <span className="font-bold text-stone-800">{product.dimensions}</span>
                </div>
              )}

              {product.production_time && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <span className="text-stone-400 font-medium flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> Production
                  </span>
                  <span className="font-bold text-stone-800">{product.production_time}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                <span className="text-stone-400 font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" /> Origin
                </span>
                <span className="font-bold text-stone-800">{store.location}, {store.state}</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200/60"
                  >
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Send Enquiry Primary Action Button */}
            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  setEnquirySuccess(false);
                  setShowEnquiryModal(true);
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Interested in this product? Send Enquiry
              </button>
            </div>
          </div>
        </div>

        {/* About the Artisan Section */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-serif text-lg border border-amber-200">
              {store.artisan_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">About the Artisan — {store.artisan_name}</h2>
              <p className="text-xs text-stone-500">{store.craft_type} Master Artisan from {store.location}, {store.state}</p>
            </div>
          </div>

          <p className="text-sm text-stone-700 leading-relaxed italic">
            "{product.artisan_story || store.bio || `${store.artisan_name} is a dedicated artisan keeping traditional ${store.craft_type} heritage alive.`}"
          </p>
        </section>
      </main>

      {/* Visitor Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-amber-900 text-amber-50 p-4 px-6 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-300" /> Send Enquiry to {store.artisan_name}
              </h3>
              <button
                onClick={() => setShowEnquiryModal(false)}
                className="text-amber-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-serif font-bold text-stone-800">Enquiry Sent Successfully!</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your interest in <strong>"{product.title}"</strong> has been recorded. {store.artisan_name} will receive your message in their Karigar AI dashboard.
                </p>
                <button
                  onClick={() => setShowEnquiryModal(false)}
                  className="w-full py-2.5 bg-amber-800 text-white text-xs font-semibold rounded-xl hover:bg-amber-900"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Product</label>
                  <input
                    type="text"
                    disabled
                    value={product.title}
                    className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Name <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone / Email Contact <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210 or priya@example.com"
                    value={visitorContact}
                    onChange={(e) => setVisitorContact(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Message</label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="Describe your requirement, quantity, or query..."
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Enquiry'} <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
