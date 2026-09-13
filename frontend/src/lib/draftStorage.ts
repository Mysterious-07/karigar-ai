export interface ProductDraft {
  imageBase64?: string;
  voiceTranscript?: string;
  typedInput?: string;
  craftType?: string;
}

const DRAFT_KEY = 'karigar_product_draft';

export function saveProductDraft(draft: ProductDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save product draft to localStorage:', err);
  }
}

export function loadProductDraft(): ProductDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductDraft;
  } catch (err) {
    console.warn('Failed to load product draft from localStorage:', err);
    return null;
  }
}

export function clearProductDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.warn('Failed to clear product draft:', err);
  }
}

export function hasProductDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    return Boolean(draft?.imageBase64 || draft?.voiceTranscript || draft?.typedInput);
  } catch {
    return false;
  }
}
