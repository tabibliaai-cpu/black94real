'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/stores/app'
import type { ShopProduct } from '@/lib/shop'
import { fetchProducts, fetchFeaturedProducts, fetchCategories, searchProducts } from '@/lib/shop'
import { ProductCard } from '@/components/ProductCard'
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore'

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Food', 'Services', 'Digital', 'Beauty', 'Home', 'Sports', 'Books', 'Art', 'Other']

export function StoreView() {
  const navigate = useAppStore((s) => s.navigate)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [featured, setFeatured] = useState<ShopProduct[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const lastDocRef = useRef<DocumentSnapshot<DocumentData> | null>(null)
  const categoriesRef = useRef<string[]>(CATEGORIES)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, featRes] = await Promise.all([
        fetchProducts(12),
        fetchFeaturedProducts(),
      ])
      setProducts(prodRes.products)
      lastDocRef.current = prodRes.lastDoc
      setHasMore(prodRes.products.length >= 12)
      setFeatured(featRes.length > 0 ? featRes : prodRes.products.slice(0, 6))
    } catch (err) {
      console.error('Store load error:', err)
      setProducts(getDemoProducts())
      setFeatured(getDemoProducts().slice(0, 6))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories()
      if (cats.length > 0) {
        categoriesRef.current = ['All', ...cats]
      }
    } catch {
      // use defaults
    }
  }, [])

  useEffect(() => {
    loadInitial()
    loadCategories()
  }, [loadInitial, loadCategories])

  const handleCategoryChange = async (cat: string) => {
    setActiveCategory(cat)
    setProducts([])
    lastDocRef.current = null
    setHasMore(true)
    setLoading(true)
    try {
      const res = await fetchProducts(12, undefined, cat)
      setProducts(res.products)
      lastDocRef.current = res.lastDoc
      setHasMore(res.products.length >= 12)
    } catch {
      setProducts(getDemoProducts())
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setIsSearchMode(false)
      return
    }
    setIsSearchMode(true)
    try {
      const results = await searchProducts(q)
      setProducts(results.length > 0 ? results : getDemoProducts().filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      ))
    } catch {
      setProducts(getDemoProducts().filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      ))
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore || isSearchMode) return
    setLoadingMore(true)
    try {
      const res = await fetchProducts(12, lastDocRef.current || undefined, activeCategory)
      setProducts((prev) => [...prev, ...res.products])
      lastDocRef.current = res.lastDoc
      setHasMore(res.products.length >= 12)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMore()
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasMore, loadingMore, isSearchMode])

  return (
    <div ref={scrollRef} className="h-[calc(100vh-53px-50px)] overflow-y-auto pb-24">
      {/* ─── Hero Banner ─── */}
      <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#a3d977]/20 via-[#0a0a0a] to-[#ffd700]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative p-6 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a3d977] to-[#8cc65e] flex items-center justify-center">
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Black94 Market</h1>
          </div>
          <p className="text-[13px] text-[#71767b] mb-4">Discover unique products from our community</p>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#536471]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full pl-10 pr-4 py-2.5 text-[14px] text-[#e8f0dc] placeholder-[#536471] outline-none focus:border-[#a3d977]/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ─── Category Pills ─── */}
      <div className="mt-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesRef.current.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[#a3d977] text-black shadow-md shadow-[#a3d977]/20'
                  : 'bg-white/[0.06] text-[#71767b] hover:text-[#e8f0dc] hover:bg-white/[0.1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin mb-3" />
          <p className="text-[14px] text-[#71767b]">Loading products...</p>
        </div>
      ) : (
        <>
          {/* ─── Featured Products (horizontal scroll) ─── */}
          {featured.length > 0 && !isSearchMode && (
            <div className="mt-5">
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="text-[15px] font-bold text-[#e8f0dc]">Featured Products</h2>
                <span className="text-[12px] text-[#a3d977]">See all</span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                {featured.map((product) => (
                  <div key={product.id} className="w-[160px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Trending Now (2-col grid) ─── */}
          {!isSearchMode && (
            <div className="mt-6">
              <div className="flex items-center gap-2 px-4 mb-3">
                <h2 className="text-[15px] font-bold text-[#e8f0dc]">
                  {activeCategory === 'All' ? 'Trending Now' : activeCategory}
                </h2>
                {isSearchMode && <span className="text-[12px] text-[#71767b]">{products.length} results</span>}
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#536471]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                  <p className="text-[15px] text-[#71767b]">No products found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 px-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {loadingMore && (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin" />
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <p className="text-center text-[12px] text-[#536471] py-6">You&apos;ve seen it all</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Search Results ─── */}
          {isSearchMode && (
            <div className="mt-4 px-4">
              <p className="text-[12px] text-[#536471] mb-3">
                {products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[15px] text-[#71767b]">No products match your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Demo Products ───────────────────────────────────────────────────────────

function getDemoProducts(): ShopProduct[] {
  return [
    {
      id: 'demo-1', businessId: 'biz-1', businessName: 'TechVault', businessImage: '',
      name: 'Wireless Noise Cancelling Headphones Pro', description: 'Premium wireless headphones with active noise cancellation, 30hr battery life, and Hi-Res Audio support.',
      price: 3499, compareAtPrice: 5999, category: 'Electronics', tags: ['audio', 'wireless', 'headphones'],
      images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', stock: 45, sku: 'TV-WH001',
      variants: '[{"name":"Color","values":["Black","White","Navy"]}]', isDigital: false, isFeatured: true, isActive: true,
      rating: 4.5, reviewCount: 128, soldCount: 342, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-2', businessId: 'biz-2', businessName: 'StyleHaus', businessImage: '',
      name: 'Minimalist Leather Watch - Brown', description: 'Handcrafted genuine leather strap with sapphire crystal glass face.',
      price: 1299, compareAtPrice: 2499, category: 'Fashion', tags: ['watch', 'leather', 'accessories'],
      images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', stock: 23, sku: 'SH-LW002',
      variants: '[{"name":"Strap","values":["Brown","Black","Tan"]}]', isDigital: false, isFeatured: true, isActive: true,
      rating: 4.8, reviewCount: 89, soldCount: 567, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-3', businessId: 'biz-3', businessName: 'GreenBite', businessImage: '',
      name: 'Organic Green Tea Collection (Pack of 3)', description: 'Premium organic green tea sourced from Darjeeling estates. 3 unique flavors.',
      price: 599, compareAtPrice: 899, category: 'Food', tags: ['tea', 'organic', 'beverage'],
      images: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', stock: 120, sku: 'GB-GT003',
      variants: '[{"name":"Pack","values":["3-Pack","6-Pack"]}]', isDigital: false, isFeatured: false, isActive: true,
      rating: 4.2, reviewCount: 56, soldCount: 891, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-4', businessId: 'biz-4', businessName: 'CodeCraft', businessImage: '',
      name: 'Full-Stack Web Dev Masterclass', description: 'Complete course covering React, Node.js, and deployment. Lifetime access included.',
      price: 1999, compareAtPrice: 4999, category: 'Digital', tags: ['course', 'webdev', 'programming'],
      images: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', stock: 999, sku: 'CC-WD004',
      variants: '[]', isDigital: true, isFeatured: true, isActive: true,
      rating: 4.9, reviewCount: 234, soldCount: 1205, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-5', businessId: 'biz-1', businessName: 'TechVault', businessImage: '',
      name: 'Mechanical Keyboard RGB 75%', description: 'Hot-swappable switches, per-key RGB, gasket mount design.',
      price: 4299, compareAtPrice: 5499, category: 'Electronics', tags: ['keyboard', 'mechanical', 'rgb'],
      images: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400', stock: 18, sku: 'TV-KB005',
      variants: '[{"name":"Switch","values":["Red","Blue","Brown"]},{"name":"Layout","values":["US","UK"]}]', isDigital: false, isFeatured: false, isActive: true,
      rating: 4.6, reviewCount: 76, soldCount: 198, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-6', businessId: 'biz-5', businessName: 'AuraBeauty', businessImage: '',
      name: 'Vitamin C Glow Serum 30ml', description: 'Brightening serum with 20% Vitamin C, Hyaluronic Acid, and Niacinamide.',
      price: 749, compareAtPrice: 1199, category: 'Beauty', tags: ['skincare', 'serum', 'vitamin-c'],
      images: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 67, sku: 'AB-VS006',
      variants: '[]', isDigital: false, isFeatured: false, isActive: true,
      rating: 4.4, reviewCount: 203, soldCount: 1456, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-7', businessId: 'biz-6', businessName: 'HomeNest', businessImage: '',
      name: 'Handwoven Jute Storage Basket Set', description: 'Set of 3 eco-friendly jute baskets in different sizes for organized living.',
      price: 899, category: 'Home', tags: ['storage', 'jute', 'eco-friendly'],
      images: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', stock: 34, sku: 'HN-JB007',
      variants: '[{"name":"Set","values":["3-Piece","5-Piece"]}]', isDigital: false, isFeatured: false, isActive: true,
      rating: 4.1, reviewCount: 42, soldCount: 267, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-8', businessId: 'biz-7', businessName: 'ArtistryInk', businessImage: '',
      name: 'Custom Digital Portrait Illustration', description: 'Hand-drawn digital portrait from your photo. Perfect gift for loved ones.',
      price: 1599, compareAtPrice: 2499, category: 'Art', tags: ['art', 'portrait', 'custom', 'gift'],
      images: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', stock: 999, sku: 'AI-DP008',
      variants: '[]', isDigital: true, isFeatured: true, isActive: true,
      rating: 4.7, reviewCount: 156, soldCount: 432, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ]
}
