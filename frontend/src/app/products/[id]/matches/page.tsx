"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Send, CheckCircle2, MapPin, Building2, Sparkles, AlertCircle, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { api, ProductData, BuyerMatchData } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function BuyerMatchesContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [matches, setMatches] = useState<BuyerMatchData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const prodData = await api.getProduct(productId);
      setProduct(prodData);

      const lang = localStorage.getItem("karigar_artisan_language") || "en";
      const matchData = await api.matchBuyers(productId, lang);
      setMatches(matchData);
    } catch (err: any) {
      setError(err.message || "Failed to load buyer matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const handleSendInterest = async (matchId: string) => {
    setSendingId(matchId);
    try {
      await api.sendBuyerInterest(productId, matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "contacted" } : m))
      );
    } catch (err: any) {
      setError("Failed to record interest request.");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-[#D9531E] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Matching product with wholesale buyers...</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 bg-white rounded-xl border border-[#EADBC8] text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#D9531E]" />
            AI Buyer Matches
          </h1>
          <p className="text-xs text-gray-500">{product?.title}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Product Summary Header Card */}
      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EADBC8] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#D9531E] uppercase tracking-wider">Product Status</span>
          <h3 className="font-bold text-base text-gray-900">{product?.title}</h3>
          <p className="text-xs text-gray-500">{product?.craft_type} • Price: {product?.price ? `₹${product.price}` : "Guidance set"}</p>
        </div>
        <Link
          href={`/products/${productId}/pricing`}
          className="text-xs font-bold text-[#D9531E] bg-white px-3 py-1.5 rounded-lg border border-[#EADBC8] shadow-sm"
        >
          View Price
        </Link>
      </div>

      {/* Buyer Matches List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Top Matched Buyers ({matches.length})</h2>

        {matches.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#EADBC8] text-gray-500 space-y-2">
            <p>No buyers matched yet.</p>
          </div>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="bg-white p-5 rounded-2xl border-2 border-[#EADBC8] shadow-sm hover:border-[#D9531E]/40 transition space-y-4"
            >
              {/* Card Top: Match Score & Buyer Type */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-[#D9531E] px-2.5 py-0.5 rounded-full text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      {match.buyer_type}
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                      Potential Buyer Profile
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-gray-900 pt-0.5">
                    {match.business_name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {match.location}
                  </div>
                </div>

                {/* Score Badge */}
                <div className="bg-[#D9531E] text-white font-black text-lg px-3 py-1.5 rounded-xl shadow-sm text-center">
                  {Math.round(match.match_score)}%
                  <span className="block text-[9px] font-semibold tracking-tighter uppercase opacity-90">Match</span>
                </div>
              </div>

              {/* Match Reason Box */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 space-y-1">
                <span className="font-bold text-gray-900 block">Why this buyer?</span>
                <p>{match.reason}</p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Budget Range</span>
                  <span className="font-semibold text-gray-800">{match.budget_range}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Bulk Orders</span>
                  <span className="font-semibold text-emerald-700">{match.bulk_order_interest}</span>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {match.status === "contacted" ? (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Interest Request Recorded
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendInterest(match.id)}
                    disabled={sendingId === match.id}
                    className="w-full bg-[#D9531E] hover:bg-[#B84214] text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                  >
                    {sendingId === match.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Interest
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BuyerMatchesPage(props: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <BuyerMatchesContent {...props} />
    </ProtectedRoute>
  );
}
