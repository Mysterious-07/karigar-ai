import Link from "next/link";
import { Sparkles, ArrowRight, ShoppingBag, Award, QrCode } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center py-6 text-center space-y-8">
      {/* Hero Icon */}
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-[#D9531E] to-[#F4A261] rounded-3xl flex items-center justify-center shadow-xl transform rotate-3">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-full shadow-md">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* Hero Typography */}
      <div className="space-y-3 max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Karigar <span className="text-[#D9531E]">AI</span>
        </h1>
        <p className="text-lg font-medium text-gray-700 leading-snug">
          "Turn your craft into a market-ready business."
        </p>
        <p className="text-sm text-gray-500">
          Simple AI manager designed specifically for Indian artisans. Take a photo, create catalogs, find buyers, and expand your reach.
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="w-full pt-2">
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-3 bg-[#D9531E] hover:bg-[#B84214] text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95"
        >
          Get Started / Login
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Feature Preview Badges */}
      <div className="grid grid-cols-2 gap-3 w-full pt-4 text-left">
        <div className="bg-white p-3.5 rounded-xl border border-[#EADBC8] shadow-sm flex items-start gap-3">
          <div className="p-2 bg-orange-100 text-[#D9531E] rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Instant Catalog</h4>
            <p className="text-[11px] text-gray-500">Photo to description</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#EADBC8] shadow-sm flex items-start gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Digital Store</h4>
            <p className="text-[11px] text-gray-500">Share via QR code</p>
          </div>
        </div>
      </div>
    </div>
  );
}
