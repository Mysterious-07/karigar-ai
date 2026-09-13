/**
 * Karigar AI API Client
 * Connects frontend Next.js application to FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ArtisanData {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  location: string;
  state: string;
  language: string;
  craft_type: string;
  profile_image?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductData {
  id?: string;
  artisan_id?: string;
  title: string;
  craft_type: string;
  description?: string | null;
  category?: string | null;
  material?: string | null;
  dimensions?: string | null;
  production_time?: string | null;
  price?: number | null;
  material_cost?: number | null;
  labour_cost?: number | null;
  other_cost?: number | null;
  suggested_min_price?: number | null;
  suggested_max_price?: number | null;
  suggested_price?: number | null;
  pricing_explanation?: string | null;
  pricing_confidence?: string | null;
  original_image?: string | null;
  processed_image?: string | null;
  artisan_story?: string | null;
  raw_transcript?: string | null;
  slug?: string | null;
  ai_quality_score?: number | null;
  status?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoreData {
  id: string;
  artisan_id: string;
  store_name: string;
  slug: string;
  description?: string | null;
  qr_code_path?: string | null;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EnquiryData {
  id: string;
  product_id: string;
  store_id: string;
  visitor_name?: string | null;
  visitor_contact?: string | null;
  message: string;
  status: string;
  created_at: string;
  product_title?: string | null;
  product_image?: string | null;
}

export interface BuyerMatchData {
  id: string;
  product_id: string;
  buyer_id: string;
  business_name: string;
  buyer_type: string;
  location: string;
  state?: string | null;
  buyer_label: string;
  match_score: number;
  reason: string;
  factors_breakdown: string[];
  budget_range: string;
  bulk_order_interest: string;
  status: string;
  created_at: string;
}

export interface PricingResponseData {
  suggested_min_price: number;
  suggested_max_price: number;
  suggested_price: number;
  currency: string;
  confidence: string;
  explanation: string;
  factors: string[];
  warnings: string[];
}

export interface PublicProductItem {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  craft_type: string;
  material?: string | null;
  dimensions?: string | null;
  production_time?: string | null;
  price?: number | null;
  suggested_min_price?: number | null;
  suggested_max_price?: number | null;
  suggested_price?: number | null;
  original_image?: string | null;
  processed_image?: string | null;
  artisan_story?: string | null;
  tags: string[];
  is_public: boolean;
}

export interface PublicStoreData {
  id: string;
  store_name: string;
  slug: string;
  description?: string | null;
  qr_code_path?: string | null;
  is_public: boolean;
  artisan_name: string;
  craft_type: string;
  location: string;
  state: string;
  bio?: string | null;
  profile_image?: string | null;
  products: PublicProductItem[];
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '/placeholder-art.jpg';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/uploads/${path}`;
}

function getAuthHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('karigar_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}, isFormData = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      // Ignored if not json
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  async sendOtp(phone: string) {
    return request<{ message: string; phone: string; demo_mode: boolean; dev_otp?: string }>(
      '/api/auth/send-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    );
  },

  async verifyOtp(phone: string, otp: string) {
    return request<{ token: string; token_type: string; is_new_user: boolean; artisan: ArtisanData }>(
      '/api/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }
    );
  },

  async getMe() {
    return request<ArtisanData>('/api/auth/me', { method: 'GET' });
  },

  async updateProfile(data: Partial<ArtisanData>) {
    return request<ArtisanData>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMyProducts() {
    return request<ProductData[]>('/api/products/me', { method: 'GET' });
  },

  async getMyStore() {
    return request<StoreData>('/api/stores/me', { method: 'GET' });
  },

  async getMyEnquiries() {
    return request<EnquiryData[]>('/api/enquiries/me', { method: 'GET' });
  },
};

export const api = {
  async createProduct(data: Partial<ProductData>) {
    return request<ProductData>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProduct(productId: string) {
    return request<ProductData>(`/api/products/${productId}`, { method: 'GET' });
  },

  async updateProduct(productId: string, data: Partial<ProductData>) {
    return request<ProductData>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getArtisanProducts(artisanId: string) {
    return request<ProductData[]>(`/api/artisans/${artisanId}/products`, { method: 'GET' });
  },

  async uploadProductImage(productId: string, file: File | Blob) {
    const formData = new FormData();
    formData.append('file', file);
    return request<ProductData>(
      `/api/products/${productId}/image`,
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  },

  async getImageEnhancementStatus(productId: string) {
    return request<any>(`/api/products/${productId}/image/status`, { method: 'GET' });
  },

  async generateCatalog(
    productId: string,
    description: string,
    language = 'en',
    outputLanguage = 'en'
  ) {
    return request<{ product: ProductData; quality_score: number; suggestions?: string[] }>(
      `/api/products/${productId}/generate-catalog`,
      {
        method: 'POST',
        body: JSON.stringify({
          description,
          language,
          output_language: outputLanguage,
        }),
      }
    );
  },

  async suggestPrice(productId: string, data: any) {
    return request<PricingResponseData>(`/api/products/${productId}/suggest-price`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async matchBuyers(productId: string, language = 'en') {
    return request<BuyerMatchData[]>(`/api/products/${productId}/match-buyers?language=${encodeURIComponent(language)}`, {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  },

  async getBuyerMatches(productId: string) {
    return request<BuyerMatchData[]>(`/api/products/${productId}/matches`, { method: 'GET' });
  },

  async sendBuyerInterest(productId: string, matchId: string) {
    return request<any>(`/api/products/${productId}/matches/${matchId}/interest`, {
      method: 'POST',
    });
  },

  async getArtisanStore(artisanId: string) {
    return request<StoreData>(`/api/stores/me`, { method: 'GET' });
  },

  async updateStore(storeId: string, data: Partial<StoreData>) {
    return request<StoreData>(`/api/stores/${storeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async toggleStoreProductVisibility(storeId: string, productId: string, isPublic: boolean) {
    return request<any>(`/api/stores/${storeId}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: isPublic }),
    });
  },

  async updateEnquiryStatus(enquiryId: string, status: string) {
    return request<EnquiryData>(`/api/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getPublicStore(slug: string) {
    return request<PublicStoreData>(`/api/public/stores/${slug}`, { method: 'GET' });
  },

  async getPublicProduct(slug: string, productSlug: string) {
    return request<PublicProductItem>(`/api/public/stores/${slug}/products/${productSlug}`, {
      method: 'GET',
    });
  },

  async sendPublicEnquiry(productId: string, data: any) {
    return request<any>(`/api/public/products/${productId}/enquiry`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
