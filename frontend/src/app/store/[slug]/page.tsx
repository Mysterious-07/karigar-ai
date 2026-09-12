import Metadata from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Sparkles, ShoppingBag, ArrowRight, Store, CheckCircle } from 'lucide-react';
import { api, PublicStoreData } from '@/lib/api';
import ProductImage from '@/components/ProductImage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const store = await api.getPublicStore(slug);
    return {
      title: `${store.artisan_name} — ${store.craft_type} Digital Store`,
      description: store.description || `Handcrafted ${store.craft_type} by ${store.artisan_name} from ${store.location}, ${store.state}.`,
    };
  } catch {
    return {
      title: 'Digital Storefront | Karigar AI',
    };
  }
}

export default async function PublicStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  let store: PublicStoreData;

  try {
    store = await api.getPublicStore(slug);
  } catch (err) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 font-sans pb-16">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-amber-50 py-12 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/50 border border-amber-500/30 text-amber-200 text-xs font-medium tracking-wide uppercase">
            <Store className="w-3.5 h-3.5" /> Official Digital Storefront
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-amber-100">
            {store.artisan_name}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-amber-200/90 font-medium">
            <span className="bg-amber-800/80 px-3 py-1 rounded-md border border-amber-600/40">
              {store.craft_type}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              {store.location}, {store.state}
            </span>
          </div>

          {store.bio && (
            <div className="max-w-2xl mx-auto mt-6 p-4 rounded-xl bg-stone-950/40 border border-amber-500/20 text-amber-100/90 text-sm leading-relaxed italic">
              "{store.bio}"
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        {/* Products Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-amber-700" />
                Featured Creations
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Authentic handcrafted pieces directly from the artisan's workshop
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {store.products.length} Products Available
            </span>
          </div>

          {store.products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-amber-200 p-8 shadow-sm">
              <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-700">No public products yet</h3>
              <p className="text-sm text-stone-500 mt-1">Check back soon for new handcrafted arrivals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.products.map((product) => {
                const minPrice = product.suggested_min_price || product.price || 0;
                const maxPrice = product.suggested_max_price || (minPrice ? minPrice * 1.25 : 0);
                const hasPriceRange = minPrice > 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                  >
                    {/* Product Image Box */}
                    <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                      <ProductImage
                        src={product.processed_image || product.original_image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-amber-900/90 text-amber-100 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm backdrop-blur-xs">
                        {product.craft_type}
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                          {product.description || 'Authentic handcrafted artwork.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          {hasPriceRange ? (
                            <div className="text-sm font-bold text-amber-900">
                              ₹{minPrice.toLocaleString('en-IN')}
                              {maxPrice > minPrice && ` – ₹${Math.round(maxPrice).toLocaleString('en-IN')}`}
                            </div>
                          ) : (
                            <div className="text-xs text-stone-400">Price on request</div>
                          )}
                          <span className="text-[10px] text-amber-700 font-medium">Verified Price Range</span>
                        </div>

                        <Link
                          href={`/store/${store.slug}/product/${product.slug || product.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shadow-xs"
                        >
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Karigar AI Digital Verification Footer Badge */}
        <footer className="pt-10 border-t border-amber-200 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs text-stone-500 font-medium bg-white px-4 py-2 rounded-full border border-stone-200 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Crafted & Verified with <strong className="text-amber-800 font-semibold">Karigar AI</strong></span>
          </div>
          <p className="text-[11px] text-stone-400">
            Empowering Indian artisans through digital catalogs, fair price guidance, and direct buyer connections.
          </p>
        </footer>
      </main>
    </div>
  );
}
