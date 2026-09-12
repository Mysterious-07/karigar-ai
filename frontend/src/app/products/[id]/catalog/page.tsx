"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Award, Info, Share2, Layers } from "lucide-react";
import Link from "next/link";
import { api, ProductData, getImageUrl } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MarketingShareModal from "@/components/MarketingShareModal";

const CATEGORY_OPTIONS = [
  "Handicrafts",
  "Home Decor & Furnishings",
  "Paintings & Wall Art",
  "Pottery & Ceramics",
  "Textiles & Apparel",
  "Jewelry & Accessories",
  "Woodwork & Furniture",
  "Sculptures & Idols",
  "Metalware & Utensils",
  "Leather Crafts",
];

const CRAFT_TYPE_OPTIONS = [
  "Handicrafts",
  "Warli Art",
  "Madhubani Painting",
  "Pattachitra",
  "Terracotta & Clay Pottery",
  "Brass & Bronze Craft",
  "Block Printing & Bandhani",
  "Bamboo & Cane Work",
  "Wood Carving & Inlay",
  "Zardozi Embroidery",
  "Blue Pottery",
  "Leather Craft",
];

const MATERIAL_OPTIONS = [
  "Natural Clay & Terracotta",
  "Teak / Sheesham Wood",
  "Pure Cotton / Silk",
  "Brass & Bronze",
  "Canvas & Natural Pigments",
  "Bamboo & Jute",
  "Marble & Stone",
  "Papier-Mâché",
  "Genuine Leather",
  "Mixed Media",
  "Not specified",
];

const DIMENSION_OPTIONS = [
  "12 x 12 inches (Small)",
  "18 x 24 inches (Medium)",
  "24 x 36 inches (Large)",
  "6 x 6 x 8 inches (3D Object)",
  "10 x 10 x 14 inches (3D Object)",
  "Standard Free Size",
  "Custom / Made to Order",
  "Not specified",
];

const PRODUCTION_TIME_OPTIONS = [
  "1 - 2 Days",
  "3 - 5 Days",
  "1 Week (7 Days)",
  "2 Weeks (14 Days)",
  "3 - 4 Weeks (Made to Order)",
  "Not specified",
];

const STORY_TEMPLATES = [
  {
    label: "Heritage Tradition",
    text: "Crafted using age-old traditional techniques passed down through generations of skilled artisans in rural India.",
  },
  {
    label: "Eco-Friendly & Organic",
    text: "Handmade using 100% natural, sustainable, and eco-friendly materials, celebrating Indian cultural heritage.",
  },
  {
    label: "Tribal Folklore & Art",
    text: "Authentic tribal artwork representing cultural folklore, nature, and community life handcrafted with utmost passion.",
  },
];

function CatalogViewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [enhancementStatus, setEnhancementStatus] = useState<{
    ai_background_removal: { available: boolean; model?: string; description: string };
    lighting_enhancement: { available: boolean; method: string; description: string };
    canvas_formatting: { available: boolean; description: string };
    product_has_enhanced_image: boolean;
    product_original_image?: string;
    product_enhanced_image?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    craft_type: "",
    material: "",
    dimensions: "",
    production_time: "",
    price: "",
    artisan_story: "",
    tags: "",
  });

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
      setQualityScore(data.ai_quality_score || 85);
      
      setFormData({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        craft_type: data.craft_type || "",
        material: data.material || t.notSpecified,
        dimensions: data.dimensions || t.notSpecified,
        production_time: data.production_time || t.notSpecified,
        price: data.price ? String(data.price) : "",
        artisan_story: data.artisan_story || "",
        tags: data.craft_type ? `${data.craft_type}, Handmade` : "Handmade",
      });

      // Load image enhancement status
      try {
        const status = await api.getImageEnhancementStatus(productId);
        setEnhancementStatus(status);
      } catch (err) {
        console.warn("Could not load enhancement status:", err);
      }
    } catch (err: any) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await api.updateProduct(productId, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        craft_type: formData.craft_type,
        material: formData.material,
        dimensions: formData.dimensions,
        production_time: formData.production_time,
        price: formData.price ? parseFloat(formData.price) : undefined,
        artisan_story: formData.artisan_story,
      });

      setProduct(updated);
      setQualityScore(updated.ai_quality_score || 90);
      setSuccessMsg("✓ " + t.saveCatalogBtn);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err.message || t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await api.generateCatalog(productId, formData.description || "Handcrafted artisan item", language);
      setProduct(res.product);
      setQualityScore(res.quality_score);
      setFormData({
        title: res.product.title || "",
        description: res.product.description || "",
        category: res.product.category || "",
        craft_type: res.product.craft_type || "",
        material: res.product.material || t.notSpecified,
        dimensions: res.product.dimensions || t.notSpecified,
        production_time: res.product.production_time || t.notSpecified,
        price: res.product.price ? String(res.product.price) : "",
        artisan_story: res.product.artisan_story || "",
        tags: res.product.craft_type ? `${res.product.craft_type}, Handmade` : "Handmade",
      });
      setSuccessMsg("✓ " + t.regenerateBtn);
    } catch (err: any) {
      setError(err.message || t.errorGeneric);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-[#D9531E] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-stone-700">{t.generatingCatalogTitle}</p>
      </div>
    );
  }

  const rawImagePath = product?.processed_image || product?.original_image;
  const imageUrl = getImageUrl(rawImagePath);

  return (
    <div className="py-2 space-y-6 text-stone-800">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2.5 bg-white rounded-2xl border border-[#EADBC8] text-stone-700 hover:bg-stone-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900">{t.aiCatalogTitle}</h1>
            <p className="text-xs font-medium text-stone-500">{t.aiGeneratedNotice}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="p-2.5 bg-orange-100 text-[#D9531E] hover:bg-orange-200 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {t.regenerateBtn}
        </button>
      </div>

      {/* AI Transparency Notice Banner */}
      <div className="p-4 bg-amber-50 rounded-3xl border-2 border-amber-200 text-stone-900 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-extrabold shrink-0 mt-0.5">
          ✨
        </div>
        <div className="space-y-0.5">
          <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide block">
            {t.aiGeneratedBadge}
          </span>
          <p className="text-xs font-semibold text-stone-800 leading-snug">
            {t.aiGeneratedNotice}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Catalog Quality / Listing Completeness Card */}
      <div className="bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#D9531E]" />
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Catalog Quality / Listing Completeness</h3>
              <p className="text-xs text-stone-500 font-medium">✨ AI द्वारा तैयार (Created by AI) • कृपया प्रकाशित करने से पहले जानकारी जांच लें।</p>
            </div>
          </div>
          <span className="text-xl font-black text-[#D9531E] bg-orange-50 px-3.5 py-1 rounded-xl border border-orange-200">
            {Math.round(qualityScore)}%
          </span>
        </div>

        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-[#D9531E] h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, qualityScore))}%` }}
          />
        </div>

        {/* Itemized Completeness Checklist */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Title
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Description
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Category & Craft
          </div>
          <div className={`flex items-center gap-1.5 ${formData.material && formData.material !== "Not specified" ? "text-emerald-700" : "text-amber-700 font-bold"}`}>
            {formData.material && formData.material !== "Not specified" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {formData.material && formData.material !== "Not specified" ? "Material" : "⚠️ Material missing"}
          </div>
          <div className={`flex items-center gap-1.5 ${formData.dimensions && formData.dimensions !== "Not specified" ? "text-emerald-700" : "text-amber-700 font-bold"}`}>
            {formData.dimensions && formData.dimensions !== "Not specified" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {formData.dimensions && formData.dimensions !== "Not specified" ? "Dimensions" : "⚠️ Dimensions missing"}
          </div>
          <div className={`flex items-center gap-1.5 ${formData.price ? "text-emerald-700" : "text-amber-700 font-bold"}`}>
            {formData.price ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {formData.price ? "Price" : "⚠️ Price missing"}
          </div>
        </div>
      </div>

      {/* Product Photo Preview with Enhancement Status */}
      <div className="bg-white p-4 rounded-3xl border border-[#EADBC8] shadow-sm">
        {/* Enhancement Status Badge */}
        {enhancementStatus && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {enhancementStatus.ai_background_removal.available && enhancementStatus.product_has_enhanced_image && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                <Sparkles className="w-3 h-3" />
                AI Enhanced Photo
              </span>
            )}
            {enhancementStatus.product_has_enhanced_image && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-300">
                <Layers className="w-3 h-3" />
                Professional Canvas
              </span>
            )}
          </div>
        )}

        {/* Image Comparison View */}
        {enhancementStatus && enhancementStatus.product_has_enhanced_image && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Original Photo</p>
              <div className="relative inline-block overflow-hidden rounded-xl border border-stone-200">
                <img
                  src={getImageUrl(enhancementStatus.product_original_image)}
                  alt="Original"
                  className="max-h-28 mx-auto rounded-xl object-cover"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-art.jpg'; }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#D9531E] uppercase tracking-wider mb-1">AI Enhanced</p>
              <div className="relative inline-block overflow-hidden rounded-xl border-2 border-[#D9531E]/30">
                <img
                  src={getImageUrl(enhancementStatus.product_enhanced_image)}
                  alt="Enhanced"
                  className="max-h-28 mx-auto rounded-xl object-cover shadow-sm"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-art.jpg'; }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Single Image Display (fallback) */}
        {!enhancementStatus || !enhancementStatus.product_has_enhanced_image ? (
          <div className="text-center">
            <img
              src={imageUrl}
              alt={formData.title}
              className="max-h-64 mx-auto rounded-2xl object-cover shadow-sm border border-stone-100"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-art.jpg';
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[10px] font-bold text-[#D9531E] uppercase tracking-wider mb-1">Final Enhanced Photo</p>
            <img
              src={getImageUrl(enhancementStatus.product_enhanced_image)}
              alt={formData.title}
              className="max-h-48 mx-auto rounded-2xl object-cover shadow-sm border border-stone-100"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-art.jpg';
              }}
            />
          </div>
        )}
      </div>

      {/* Editable Form */}
      <form onSubmit={handleSaveCatalog} className="space-y-4 bg-white p-6 rounded-3xl border border-[#EADBC8] shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
            {t.titleField}
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-base font-extrabold"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
            {t.descriptionField}
          </label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm leading-relaxed font-medium"
          />
        </div>

        {/* Category & Craft Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.categoryField}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm bg-white font-semibold cursor-pointer"
            >
              <option value="" disabled>-- {t.categoryField} --</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {formData.category && !CATEGORY_OPTIONS.includes(formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.craftTypeField}
            </label>
            <select
              name="craft_type"
              value={formData.craft_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, craft_type: e.target.value }))}
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm bg-white font-semibold cursor-pointer"
            >
              <option value="" disabled>-- {t.craftTypeField} --</option>
              {CRAFT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {formData.craft_type && !CRAFT_TYPE_OPTIONS.includes(formData.craft_type) && (
                <option value={formData.craft_type}>{formData.craft_type}</option>
              )}
            </select>
          </div>
        </div>

        {/* Material & Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.materialField}
            </label>
            <select
              name="material"
              value={formData.material}
              onChange={(e) => setFormData((prev) => ({ ...prev, material: e.target.value }))}
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm bg-white font-semibold cursor-pointer"
            >
              <option value="" disabled>-- {t.materialField} --</option>
              {MATERIAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {formData.material && !MATERIAL_OPTIONS.includes(formData.material) && (
                <option value={formData.material}>{formData.material}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.dimensionsField}
            </label>
            <select
              name="dimensions"
              value={formData.dimensions}
              onChange={(e) => setFormData((prev) => ({ ...prev, dimensions: e.target.value }))}
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm bg-white font-semibold cursor-pointer"
            >
              <option value="" disabled>-- {t.dimensionsField} --</option>
              {DIMENSION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {formData.dimensions && !DIMENSION_OPTIONS.includes(formData.dimensions) && (
                <option value={formData.dimensions}>{formData.dimensions}</option>
              )}
            </select>
          </div>
        </div>

        {/* Production Time & Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.productionTimeField}
            </label>
            <select
              name="production_time"
              value={formData.production_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, production_time: e.target.value }))}
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm bg-white font-semibold cursor-pointer"
            >
              <option value="" disabled>-- {t.productionTimeField} --</option>
              {PRODUCTION_TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {formData.production_time && !PRODUCTION_TIME_OPTIONS.includes(formData.production_time) && (
                <option value={formData.production_time}>{formData.production_time}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
              {t.priceField}
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 1500"
              className="w-full px-3 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-semibold"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-1">
            {t.tagsField}
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Handicrafts, Handmade"
            className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm font-medium"
          />
        </div>

        {/* Artisan Story */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider">
              {t.artisanStoryField}
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setFormData((prev) => ({ ...prev, artisan_story: e.target.value }));
                }
              }}
              defaultValue=""
              className="text-xs text-[#D9531E] font-bold bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="" disabled>✨ Choose Template...</option>
              {STORY_TEMPLATES.map((story, i) => (
                <option key={i} value={story.text}>
                  {story.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="artisan_story"
            rows={3}
            value={formData.artisan_story}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm italic font-medium text-stone-800"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#D9531E] hover:bg-[#B84214] text-white font-extrabold py-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base active:scale-98"
          >
            <Save className="w-5 h-5" />
            {saving ? t.savingCatalogBtn : t.saveCatalogBtn}
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base active:scale-98"
          >
            <Share2 className="w-5 h-5" />
            <span>📱 WhatsApp शेयर संदेश</span>
          </button>
        </div>
      </form>

      <MarketingShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        product={product}
      />
    </div>
  );
}

export default function CatalogViewPage(props: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <CatalogViewContent {...props} />
    </ProtectedRoute>
  );
}
