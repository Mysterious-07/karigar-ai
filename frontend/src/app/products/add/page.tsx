"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Edit3, Mic, PenLine, Camera, Image } from "lucide-react";
import Link from "next/link";
import { api, authApi } from "@/lib/api";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import { useLanguage } from "@/components/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { saveProductDraft, loadProductDraft, clearProductDraft } from "@/lib/draftStorage";
import { compressImageFile } from "@/lib/imageCompressor";

function AddProductContent() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [craftType, setCraftType] = useState("Warli Art");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadProductDraft();
    if (draft) {
      if (draft.imageBase64) setImagePreview(draft.imageBase64);
      if (draft.voiceTranscript) setVoiceTranscript(draft.voiceTranscript);
      if (draft.typedInput) setTypedInput(draft.typedInput);
      if (draft.craftType) setCraftType(draft.craftType);
      setDraftRestored(true);
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (imagePreview || voiceTranscript || typedInput) {
      saveProductDraft({
        imageBase64: imagePreview || undefined,
        voiceTranscript: voiceTranscript || undefined,
        typedInput: typedInput || undefined,
        craftType: craftType,
      });
    }
  }, [imagePreview, voiceTranscript, typedInput, craftType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPEG, PNG, or WebP).");
        return;
      }
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = "";
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(text);
  };

  const rawArtisanInput = voiceTranscript.trim() || typedInput.trim();

  const handleRecordAgain = () => {
    setVoiceTranscript("");
    setIsEditingTranscript(false);
  };

  const handleGenerateCatalog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile && !imagePreview) {
      setError(t.wizardStep1Title + " - " + t.wizardStep1Desc);
      return;
    }
    if (!rawArtisanInput) {
      setError(t.wizardStep2Title + " - " + t.wizardStep2Desc);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const currentMe = await authApi.getMe();
      const artisanId = currentMe.id!;

      // Create product draft
      const product = await api.createProduct({
        artisan_id: artisanId,
        title: "Draft Handcrafted Product",
        craft_type: craftType || currentMe.craft_type || "Handicrafts",
        description: rawArtisanInput,
      });

      // Compress photo before upload
      let fileToUpload: File | null = selectedFile;
      if (!fileToUpload && imagePreview) {
        // Convert base64 preview back to Blob/File if selectedFile was lost in draft restore
        const res = await fetch(imagePreview);
        const blob = await res.blob();
        fileToUpload = new File([blob], "restored_draft_photo.jpg", { type: "image/jpeg" });
      }

      if (fileToUpload) {
        setIsProcessing(true);
        try {
          const compressed = await compressImageFile(fileToUpload);
          await api.uploadProductImage(product.id!, compressed);
        } finally {
          setIsProcessing(false);
        }
      }

      // Generate catalog with AI — marketplace content in English, input language preserved
      await api.generateCatalog(product.id!, rawArtisanInput, language, "en");

      // Clear local draft on success
      clearProductDraft();

      // Navigate to catalog review
      router.push(`/products/${product.id}/catalog`);
    } catch (err: any) {
      setIsProcessing(false);
      const retryText = language === 'mr'
        ? "AI कॅटलॉग तयार करण्यात अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा. आपली माहिती या फोनमध्ये सुरक्षित आहे."
        : language === 'en'
          ? "AI catalog generation failed. Please try again. Your information is safely saved."
          : "AI कैटलॉग जनरेशन विफल हुआ. कृपया पुनः प्रयास करें. आपकी जानकारी सुरक्षित है.";
      setError(retryText);
    }
  };

  if (isProcessing) {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center relative shadow-inner">
          <Sparkles className="w-10 h-10 text-[#D9531E] animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-stone-900">{t.generatingCatalogTitle}</h2>
          <p className="text-xs text-stone-500 font-medium">{t.generatingCatalogDesc}</p>
        </div>

        <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-[#EADBC8] shadow-sm text-left space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#D9531E] animate-spin shrink-0" />
            <span className="text-sm font-bold text-stone-900">{t.generatingCatalogTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
            <span className="text-sm font-bold text-stone-400">{t.generatingCatalogDesc}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
            <span className="text-sm font-bold text-stone-400">{t.aiCatalogTitle}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6 text-stone-800">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2.5 bg-white rounded-2xl border border-[#EADBC8] text-stone-700 hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-stone-900">{t.addProductCardTitle}</h1>
          <p className="text-xs font-medium text-stone-500">{t.addProductCardDesc}</p>
        </div>
      </div>

      {draftRestored && (
        <div className="p-3 bg-[#EADBC8]/40 border border-[#D9531E]/30 text-stone-800 text-xs font-bold rounded-2xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            ✏️ ड्राफ्ट पुनर्प्राप्त केला (Draft Restored from local memory)
          </span>
          <button
            onClick={() => {
              clearProductDraft();
              setImagePreview(null);
              setSelectedFile(null);
              setVoiceTranscript("");
              setTypedInput("");
              setDraftRestored(false);
            }}
            className="text-[11px] text-[#D9531E] underline hover:text-[#B84214]"
          >
            हटवा (Discard)
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#D9531E] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-bold text-stone-900">{error}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleGenerateCatalog()}
                className="px-4 py-2 bg-[#D9531E] hover:bg-[#B84214] text-white text-xs font-extrabold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
              >
                🔄 फिर कोशिश करें (Retry)
              </button>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-bold text-stone-600 underline"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerateCatalog} className="space-y-6 bg-white p-6 sm:p-7 rounded-3xl border border-[#EADBC8] shadow-sm">
        {/* STEP 1: Product Photo */}
        <div className="space-y-2">
          <label className="block text-sm font-black text-stone-900 uppercase tracking-wide">
            {t.wizardStep1Title}
          </label>
          <p className="text-xs text-stone-500 font-medium">{t.wizardStep1Desc}</p>

          {/* Hidden file inputs for camera and gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
            aria-label="Take photo with camera"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            aria-label="Choose image from gallery"
          />

          <div className="space-y-3">
            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative border-2 border-dashed border-[#D9531E]/40 rounded-3xl p-6 text-center bg-[#FAF8F5]">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="max-h-60 mx-auto rounded-2xl object-cover shadow-sm border border-stone-200"
                  />
                  <p className="text-xs text-[#D9531E] font-extrabold mt-3">{t.photoAdded}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-2xl font-bold text-sm transition active:scale-95"
                  >
                    <Camera className="w-5 h-5 text-[#D9531E]" />
                    <span>{t.takePhotoBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleChooseFromGallery}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-2xl font-bold text-sm transition active:scale-95"
                  >
                    <Image className="w-5 h-5 text-[#D9531E]" />
                    <span>{t.chooseGalleryBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="w-full flex items-center justify-center gap-3 px-5 py-5 bg-[#D9531E] hover:bg-[#B84214] text-white rounded-2xl font-extrabold text-base transition active:scale-95 shadow-sm"
                >
                  <Camera className="w-6 h-6" />
                  <span>{t.takePhotoBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={handleChooseFromGallery}
                  className="w-full flex items-center justify-center gap-3 px-5 py-5 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 rounded-2xl font-extrabold text-base transition active:scale-95"
                >
                  <Image className="w-6 h-6 text-[#D9531E]" />
                  <span>{t.chooseGalleryBtn}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Language & Voice Input */}
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-black text-stone-900 uppercase tracking-wide">
                {t.wizardStep2Title}
              </label>
              <p className="text-xs text-stone-500 font-medium">{t.wizardStep2Desc}</p>
            </div>
            <div className="flex gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`px-2.5 py-1 rounded-lg transition ${language === 'mr' ? 'bg-[#D9531E] text-white' : 'text-stone-600'}`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg transition ${language === 'hi' ? 'bg-[#D9531E] text-white' : 'text-stone-600'}`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition ${language === 'en' ? 'bg-[#D9531E] text-white' : 'text-stone-600'}`}
              >
                EN
              </button>
            </div>
          </div>

          <VoiceRecorder
            language={language}
            onTranscriptChange={handleVoiceTranscript}
            initialTranscript={voiceTranscript}
          />

          {/* STEP 3: "What you told us" Transcript Card */}
          {voiceTranscript.trim() && (
            <div className="bg-amber-50/90 p-5 rounded-3xl border-2 border-amber-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">🎙</div>
                <h4 className="font-extrabold text-base text-stone-900">{t.whatYouToldUs}</h4>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold ml-auto border border-amber-300">
                  {t.rawInputBadge}
                </span>
              </div>

              {isEditingTranscript ? (
                <textarea
                  rows={4}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-amber-300 focus:border-[#D9531E] outline-none text-sm leading-relaxed bg-white font-medium"
                />
              ) : (
                <p className="text-sm text-stone-800 leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-amber-200/60 italic font-medium">
                  &ldquo;{voiceTranscript}&rdquo;
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  className="text-xs font-bold text-amber-900 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-amber-300 rounded-xl transition hover:bg-amber-100"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {isEditingTranscript ? t.doneEditingBtn : t.editBtn}
                </button>
                <button
                  type="button"
                  onClick={handleRecordAgain}
                  className="text-xs font-bold text-amber-900 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-amber-300 rounded-xl transition hover:bg-amber-100"
                >
                  <Mic className="w-3.5 h-3.5" /> {t.recordAgainBtn}
                </button>
              </div>

              <p className="text-[11px] text-amber-800 leading-snug font-medium">
                {t.rawInputExplanation}
              </p>
            </div>
          )}

          {/* Text Fallback */}
          {!voiceTranscript.trim() && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-stone-700 flex items-center gap-1">
                  <PenLine className="w-3.5 h-3.5 text-[#D9531E]" /> {t.orTypeDetails}
                </span>
              </div>
              <textarea
                rows={4}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={t.typePlaceholder}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#D9531E] outline-none text-sm leading-relaxed font-medium"
              />
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={!rawArtisanInput || !selectedFile}
          className={`w-full text-white text-lg font-black py-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-98 ${rawArtisanInput && selectedFile
            ? "bg-[#D9531E] hover:bg-[#B84214] hover:shadow-lg"
            : "bg-stone-300 cursor-not-allowed"
            }`}
        >
          <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          {t.generateCatalogBtn}
        </button>
      </form>
    </div>
  );
}

export default function AddProduct() {
  return (
    <ProtectedRoute>
      <AddProductContent />
    </ProtectedRoute>
  );
}
