"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, IndianRupee, CheckCircle2, AlertCircle, Info, ArrowRight, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";
import { api, ProductData, PricingResponseData } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function PricingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    material_cost: "600",
    labour_cost: "900",
    other_cost: "200",
    production_time: "3 days",
    current_price: "",
  });

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
      if (data.material_cost) setFormData(prev => ({ ...prev, material_cost: String(data.material_cost) }));
      if (data.labour_cost) setFormData(prev => ({ ...prev, labour_cost: String(data.labour_cost) }));
      if (data.other_cost) setFormData(prev => ({ ...prev, other_cost: String(data.other_cost) }));
      if (data.production_time) setFormData(prev => ({ ...prev, production_time: data.production_time || "" }));

      if (data.suggested_price) {
        setPricingResult({
          suggested_min_price: data.suggested_min_price || data.suggested_price * 0.85,
          suggested_max_price: data.suggested_max_price || data.suggested_price * 1.15,
          suggested_price: data.suggested_price,
          currency: "₹",
          confidence: data.pricing_confidence || "Medium",
          explanation: data.pricing_explanation || "Price guidance based on craft inputs.",
          factors: ["Artisan labour effort", "Material cost provided", "Traditional craft value"],
          warnings: []
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleCalculatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setError(null);

    try {
      const lang = localStorage.getItem("karigar_artisan_language") || "en";
      const result = await api.suggestPrice(productId, {
        material_cost: formData.material_cost ? parseFloat(formData.material_cost) : 0,
        labour_cost: formData.labour_cost ? parseFloat(formData.labour_cost) : 0,
        other_cost: formData.other_cost ? parseFloat(formData.other_cost) : 0,
        production_time: formData.production_time,
        current_price: formData.current_price ? parseFloat(formData.current_price) : undefined,
        language: lang
      });
      setPricingResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to calculate price guidance.");
    } finally {
      setCalculating(false);
    }
  };

  const handleAcceptPrice = async () => {
    if (!pricingResult) return;
    try {
      await api.updateProduct(productId, {
        price: pricingResult.suggested_price,
        suggested_min_price: pricingResult.suggested_min_price,
        suggested_max_price: pricingResult.suggested_max_price,
        suggested_price: pricingResult.suggested_price,
        pricing_explanation: pricingResult.explanation,
        pricing_confidence: pricingResult.confidence
      });
      router.push(`/products/${productId}/matches`);
    } catch (err: any) {
      setError("Failed to save price to product.");
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-[#D9531E] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading pricing workspace...</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/products/${productId}/catalog`} className="p-2 bg-white rounded-xl border border-[#EADBC8] text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Price Guidance</h1>
            <p className="text-xs text-gray-500">{product?.title}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Positioning Disclaimer Banner */}
      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Estimated Price Guidance</span>
          <span>AI pricing recommendations are intended as market selling guidance. You retain full control over your final price.</span>
        </div>
      </div>

      {/* Pricing Input Form */}
      <form onSubmit={handleCalculatePricing} className="bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-sm space-y-4">
        <h3 className="font-bold text-base text-gray-900">Production Cost Inputs</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Material Cost (सामग्री खर्च - ₹)
            </label>
            <input
              type="number"
              value={formData.material_cost}
              onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })}
              placeholder="e.g. 600"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#D9531E] outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Labour Cost (मजदूरी खर्च - ₹)
            </label>
            <input
              type="number"
              value={formData.labour_cost}
              onChange={(e) => setFormData({ ...formData, labour_cost: e.target.value })}
              placeholder="e.g. 900"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#D9531E] outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Other Costs (अन्य खर्च - ₹)
            </label>
            <input
              type="number"
              value={formData.other_cost}
              onChange={(e) => setFormData({ ...formData, other_cost: e.target.value })}
              placeholder="e.g. 200"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#D9531E] outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Production Time (समय)
            </label>
            <select
              value={formData.production_time}
              onChange={(e) => setFormData({ ...formData, production_time: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#D9531E] outline-none text-sm bg-white font-medium cursor-pointer"
            >
              <option value="" disabled>-- Select Time --</option>
              <option value="1 - 2 Days">1 - 2 Days</option>
              <option value="3 - 5 Days">3 - 5 Days</option>
              <option value="1 Week (7 Days)">1 Week (7 Days)</option>
              <option value="2 Weeks (14 Days)">2 Weeks (14 Days)</option>
              <option value="3 - 4 Weeks (Made to Order)">3 - 4 Weeks (Made to Order)</option>
              {formData.production_time &&
                !["1 - 2 Days", "3 - 5 Days", "1 Week (7 Days)", "2 Weeks (14 Days)", "3 - 4 Weeks (Made to Order)"].includes(formData.production_time) && (
                  <option value={formData.production_time}>{formData.production_time}</option>
                )}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={calculating}
          className="w-full bg-[#D9531E] hover:bg-[#B84214] text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base"
        >
          {calculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating Guidance...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-200" />
              Get AI Price Suggestion
            </>
          )}
        </button>
      </form>

      {/* Pricing Recommendation Card */}
      {pricingResult && (
        <div className="bg-gradient-to-br from-white to-orange-50/50 p-6 rounded-2xl border-2 border-[#D9531E]/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider flex items-center gap-1">
              💰 AI Price Guidance
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              pricingResult.confidence === "High"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}>
              Confidence: {pricingResult.confidence}
            </span>
          </div>

          {/* Big Price Display */}
          <div className="text-center py-2 space-y-1 bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              ₹{pricingResult.suggested_min_price.toLocaleString()} — ₹{pricingResult.suggested_max_price.toLocaleString()}
            </div>
            <p className="text-sm font-bold text-[#D9531E]">
              सुझाई गई कीमत (Suggested Price): <span className="text-xl font-black">₹{pricingResult.suggested_price.toLocaleString()}</span>
            </p>
            <p className="text-xs font-bold text-stone-600 pt-1 border-t border-amber-200/80 mt-2">
              💡 यह केवल सुझाव है। अंतिम कीमत आप तय करेंगे। <br />
              <span className="font-normal text-stone-500">(This is only a recommendation. The final selling price is entirely your decision.)</span>
            </p>
          </div>

          {/* Explanation & Factors */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2">
            <p className="font-semibold text-gray-900">{pricingResult.explanation}</p>
            {pricingResult.factors.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800 block mb-1">Key Factors:</span>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  {pricingResult.factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleAcceptPrice}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accept & Save Price
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PricingPage(props: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <PricingContent {...props} />
    </ProtectedRoute>
  );
}
