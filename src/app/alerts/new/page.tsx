"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell, Home, Loader2, ArrowLeft, Plus, X, Link as LinkIcon,
  ShoppingCart, ShoppingBag, Package, Globe, Monitor, Star,
  ChevronDown, ChevronUp, Play, CheckCircle, XCircle, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-token';
import type { Platform } from '@/types';

// ---------------------------------------------------------------------------
// Platform registry
// ---------------------------------------------------------------------------

type PlatformDef = {
  label: string;
  description: string;
  type: 'property' | 'product';
  currency: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PLATFORMS: Record<Platform, PlatformDef> = {
  '591': {
    label: '591 Rent',
    description: 'Taiwan property rental',
    type: 'property',
    currency: 'TWD',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    icon: Home,
  },
  'momo': {
    label: 'Momo Shop',
    description: 'Taiwan ecommerce',
    type: 'product',
    currency: 'TWD',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    icon: ShoppingCart,
  },
  'pchome': {
    label: 'PChome',
    description: 'Taiwan tech & electronics',
    type: 'product',
    currency: 'TWD',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50',
    icon: Monitor,
  },
  'amazon': {
    label: 'Amazon',
    description: 'Global ecommerce',
    type: 'product',
    currency: 'USD',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50',
    icon: Package,
  },
  'shopee': {
    label: 'Shopee',
    description: 'Southeast Asia / Taiwan',
    type: 'product',
    currency: 'TWD',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-400',
    bgColor: 'bg-orange-50',
    icon: ShoppingBag,
  },
  'custom': {
    label: 'Custom',
    description: 'Any website',
    type: 'product',
    currency: 'TWD',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
    bgColor: 'bg-slate-50',
    icon: Globe,
  },
};

const PLATFORM_ORDER: Platform[] = ['591', 'momo', 'pchome', 'amazon', 'shopee', 'custom'];

// ---------------------------------------------------------------------------
// Suggestions per platform
// ---------------------------------------------------------------------------

const SUGGESTIONS: Partial<Record<Platform, {
  searchTerms?: string[];
  categories?: string[];
  brands?: string[];
  keywords?: string[];
}>> = {
  '591': {
    keywords: ['停車位', '陽台', '電梯', '有傢俱', '近捷運', '全新裝潢', '寵物友善', '含水電', '管理員', '套房'],
  },
  'momo': {
    searchTerms: ['iPhone 16', 'AirPods Pro', 'Dyson 吸塵器', 'Nintendo Switch', 'PS5'],
    categories: ['手機/相機', '電腦/平板', '電視/影音', '美妝/保養', '家電/生活', '運動/戶外', '服飾/鞋包', '居家/寢具'],
    brands: ['Apple', 'Samsung', 'Sony', 'Dyson', 'Panasonic', 'ASUS', 'LG', 'Philips'],
  },
  'pchome': {
    searchTerms: ['RTX 4060', 'MacBook Air', '機械鍵盤', 'Samsung Galaxy S25', 'AirPods'],
    categories: ['電腦/筆電', '手機/通訊', '相機/攝影', '家電', '音響/耳機', '智慧裝置', '遊戲主機'],
    brands: ['Apple', 'ASUS', 'Acer', 'MSI', 'Samsung', 'Sony', 'Logitech'],
  },
  'amazon': {
    searchTerms: ['noise cancelling headphones', 'mechanical keyboard', 'USB-C hub', 'laptop stand'],
    categories: ['Electronics', 'Books', 'Clothing', 'Sports', 'Home & Kitchen', 'Toys & Games', 'Video Games'],
    brands: ['Apple', 'Samsung', 'Sony', 'Anker', 'Amazon Basics', 'Bose', 'Logitech'],
  },
  'shopee': {
    searchTerms: ['藍牙耳機', '保溫杯', '防曬乳', '帆布袋', '無線充電器'],
    categories: ['手機/3C', '電腦/周邊', '女裝', '男裝', '居家/生活', '運動/戶外', '美妝/保養'],
    brands: ['Apple', 'Samsung', 'Xiaomi', 'ASUS', 'JBL', 'Nike', 'Adidas'],
  },
};

// ---------------------------------------------------------------------------
// 591 form constants
// ---------------------------------------------------------------------------

const CITIES = [
  { value: 'taipei', label: '台北市' },
  { value: 'new-taipei', label: '新北市' },
  { value: 'taoyuan', label: '桃園市' },
  { value: 'hsinchu', label: '新竹市' },
  { value: 'hsinchu-county', label: '新竹縣' },
  { value: 'taichung', label: '台中市' },
  { value: 'tainan', label: '台南市' },
  { value: 'kaohsiung', label: '高雄市' },
];

const DISTRICTS: Record<string, Array<{ value: string; label: string }>> = {
  'hsinchu': [
    { value: 'east', label: '東區' },
    { value: 'north', label: '北區' },
    { value: 'xiangshan', label: '香山區' },
  ],
};

const FREQUENCIES = [
  { value: '5min', label: 'Every 5 minutes' },
  { value: '15min', label: 'Every 15 minutes' },
  { value: '30min', label: 'Every 30 minutes' },
  { value: '1hour', label: 'Every hour' },
  { value: 'daily', label: 'Daily' },
];

// Stable input styles so inline components don't remount on every keystroke
const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none';
const HALF_GRID = 'grid grid-cols-2 gap-4';

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function detectPlatform(url: string): Platform | null {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('591.com.tw')) return '591';
    if (h.includes('momoshop') || h.includes('momo.com.tw')) return 'momo';
    if (h.includes('pchome.com.tw') || h.includes('24h.pchome')) return 'pchome';
    if (/amazon\.(com|co\.jp|co\.uk|de|fr|ca|com\.au|in|sg|ae)/.test(h)) return 'amazon';
    if (h.includes('shopee.')) return 'shopee';
    return 'custom';
  } catch {
    return null;
  }
}

function extractFromUrl(url: string, platform: Platform): { searchQuery: string; asin: string; currency: string } {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    let searchQuery = '';
    let asin = '';
    let currency = PLATFORMS[platform].currency;

    switch (platform) {
      case 'momo':
        searchQuery = u.searchParams.get('keyword') || u.searchParams.get('searchKeyword') || '';
        break;
      case 'pchome':
        searchQuery = u.searchParams.get('q') || u.searchParams.get('search') || '';
        break;
      case 'amazon': {
        const asinMatch = u.pathname.match(/\/dp\/([A-Z0-9]{10})/i) || u.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
        asin = asinMatch ? asinMatch[1].toUpperCase() : '';
        searchQuery = asin || u.searchParams.get('k') || u.searchParams.get('field-keywords') || '';
        if (h.includes('amazon.co.jp')) currency = 'JPY';
        else if (h.match(/amazon\.(co\.uk|de|fr)/)) currency = 'EUR';
        break;
      }
      case 'shopee':
        searchQuery = u.searchParams.get('keyword') || '';
        break;
      default:
        break;
    }
    return { searchQuery, asin, currency };
  } catch {
    return { searchQuery: '', asin: '', currency: PLATFORMS[platform].currency };
  }
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

type FormData = {
  name: string;
  url: string;
  platform: Platform | null;
  // 591
  city: string;
  districts: string[];
  minPing: string;
  maxPing: string;
  rooms: string;
  // Shared
  minPrice: string;
  maxPrice: string;
  currency: string;
  keywords: string[];
  keywordInput: string;
  // Ecommerce shared
  searchQuery: string;
  category: string;
  brand: string;
  inStockOnly: boolean;
  // Amazon
  asin: string;
  condition: string;
  minRating: string;
  primeOnly: boolean;
  // Shopee
  shopName: string;
  // Custom
  cssSelector: string;
  // Schedule
  checkFrequency: string;
};

const initialFormData: FormData = {
  name: '',
  url: '',
  platform: null,
  city: 'hsinchu',
  districts: [],
  minPing: '',
  maxPing: '',
  rooms: '',
  minPrice: '',
  maxPrice: '',
  currency: 'TWD',
  keywords: [],
  keywordInput: '',
  searchQuery: '',
  category: '',
  brand: '',
  inStockOnly: false,
  asin: '',
  condition: 'any',
  minRating: '',
  primeOnly: false,
  shopName: '',
  cssSelector: '',
  checkFrequency: '1hour',
};

// ---------------------------------------------------------------------------
// SuggestionChips — pure component
// ---------------------------------------------------------------------------

function SuggestionChips({
  label,
  suggestions,
  onSelect,
  existing = [],
  addMode = false,
}: {
  label?: string;
  suggestions: string[];
  onSelect: (val: string) => void;
  existing?: string[];
  addMode?: boolean;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="mt-2">
      {label && <p className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => {
          const added = addMode && existing.includes(s);
          return (
            <button
              key={s}
              type="button"
              disabled={added}
              onClick={() => !added && onSelect(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                added
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-400 cursor-default'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {added ? `✓ ${s}` : `+ ${s}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stable form field components (module-level to prevent remount/focus loss)
// ---------------------------------------------------------------------------

function PriceRangeField({
  formData,
  set,
  currency = 'TWD',
  step = '1',
  minPlaceholder = '0',
  maxPlaceholder = '∞',
}: {
  formData: FormData;
  set: (patch: Partial<FormData>) => void;
  currency?: string;
  step?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}) {
  return (
    <div className={HALF_GRID}>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Min Price ({currency})</label>
        <input type="number" step={step} value={formData.minPrice} onChange={e => set({ minPrice: e.target.value })} placeholder={minPlaceholder} className={INPUT_CLS} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Max Price ({currency})</label>
        <input type="number" step={step} value={formData.maxPrice} onChange={e => set({ maxPrice: e.target.value })} placeholder={maxPlaceholder} className={INPUT_CLS} />
      </div>
    </div>
  );
}

function KeywordsField({
  formData,
  set,
  addKeyword,
  removeKeyword,
  platform,
}: {
  formData: FormData;
  set: (patch: Partial<FormData>) => void;
  addKeyword: () => void;
  removeKeyword: (kw: string) => void;
  platform: Platform | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Keywords <span className="text-slate-400 font-normal">(optional)</span>
      </label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={formData.keywordInput}
          onChange={e => set({ keywordInput: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
          placeholder="e.g., parking, balcony"
          className={`flex-1 ${INPUT_CLS}`}
        />
        <button type="button" onClick={addKeyword} className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {platform === '591' && (
        <SuggestionChips
          label="Common amenities"
          suggestions={SUGGESTIONS['591']?.keywords || []}
          onSelect={v => { if (!formData.keywords.includes(v)) set({ keywords: [...formData.keywords, v] }); }}
          addMode
          existing={formData.keywords}
        />
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {formData.keywords.map(kw => (
          <span key={kw} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
            {kw}
            <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-indigo-900">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Platform-specific criteria form (module-level to prevent remount/focus loss on input change)
function PlatformCriteriaForm({
  formData,
  set,
  addKeyword,
  removeKeyword,
  showAdvanced,
  setShowAdvanced,
}: {
  formData: FormData;
  set: (patch: Partial<FormData>) => void;
  addKeyword: () => void;
  removeKeyword: (kw: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const p = formData.platform;
  if (!p) return null;

  if (p === '591') {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
          <select value={formData.city} onChange={e => set({ city: e.target.value, districts: [] })} className={INPUT_CLS}>
            {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {DISTRICTS[formData.city] && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Districts <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS[formData.city].map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    const sel = formData.districts.includes(d.value);
                    set({ districts: sel ? formData.districts.filter(x => x !== d.value) : [...formData.districts, d.value] });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.districts.includes(d.value) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={HALF_GRID}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Min Price (TWD)</label>
            <input type="number" value={formData.minPrice} onChange={e => set({ minPrice: e.target.value })} placeholder="5000" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Price (TWD)</label>
            <input type="number" value={formData.maxPrice} onChange={e => set({ maxPrice: e.target.value })} placeholder="50000" className={INPUT_CLS} />
          </div>
        </div>
        <div className={HALF_GRID}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Min Area (ping)</label>
            <input type="number" step="0.1" value={formData.minPing} onChange={e => set({ minPing: e.target.value })} placeholder="10" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Area (ping)</label>
            <input type="number" step="0.1" value={formData.maxPing} onChange={e => set({ maxPing: e.target.value })} placeholder="50" className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Rooms</label>
          <select value={formData.rooms} onChange={e => set({ rooms: e.target.value })} className={INPUT_CLS}>
            <option value="">Any</option>
            <option value="1">1 Room</option>
            <option value="2">2 Rooms</option>
            <option value="3">3 Rooms</option>
            <option value="4">4+ Rooms</option>
          </select>
        </div>
        <KeywordsField formData={formData} set={set} addKeyword={addKeyword} removeKeyword={removeKeyword} platform={p} />
      </div>
    );
  }

  if (p === 'amazon') {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Search Keyword or ASIN <span className="text-slate-400 font-normal">(required)</span></label>
          <input
            type="text"
            value={formData.searchQuery || formData.asin}
            onChange={e => {
              const val = e.target.value;
              const looksLikeAsin = /^[A-Z0-9]{10}$/i.test(val.trim());
              set({ searchQuery: val, asin: looksLikeAsin ? val.trim().toUpperCase() : '' });
            }}
            placeholder="e.g., noise cancelling headphones  or  B09X7CRKRZ"
            className={INPUT_CLS}
          />
          {formData.asin && <p className="mt-1 text-xs text-green-600">ASIN detected: <span className="font-mono">{formData.asin}</span></p>}
        </div>
        <SuggestionChips label="Example searches" suggestions={SUGGESTIONS.amazon?.searchTerms || []} onSelect={v => set({ searchQuery: v, asin: '' })} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Department / Category <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={formData.category} onChange={e => set({ category: e.target.value })} placeholder="e.g., Electronics, Books" className={INPUT_CLS} />
          <SuggestionChips label="Departments" suggestions={SUGGESTIONS.amazon?.categories || []} onSelect={v => set({ category: v })} />
        </div>
        <PriceRangeField formData={formData} set={set} currency={formData.currency} step="0.01" minPlaceholder="0" maxPlaceholder="999" />
        <div className={HALF_GRID}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Condition</label>
            <select value={formData.condition} onChange={e => set({ condition: e.target.value })} className={INPUT_CLS}>
              <option value="any">Any</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Brand <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" value={formData.brand} onChange={e => set({ brand: e.target.value })} placeholder="e.g., Sony" className={INPUT_CLS} />
          </div>
        </div>
        <SuggestionChips label="Popular brands" suggestions={SUGGESTIONS.amazon?.brands || []} onSelect={v => set({ brand: v })} />
        <div className={HALF_GRID}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Min Star Rating</label>
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => set({ minRating: formData.minRating === String(n) ? '' : String(n) })} className={`p-1.5 rounded transition-colors ${parseInt(formData.minRating) >= n ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-300'}`}>
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
              {formData.minRating && <span className="ml-1 text-sm text-slate-600">{formData.minRating}+</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-8">
            <button type="button" onClick={() => set({ primeOnly: !formData.primeOnly })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.primeOnly ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.primeOnly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm font-medium text-slate-700">Prime only</label>
          </div>
        </div>
      </div>
    );
  }

  if (p === 'shopee') {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Search Keyword <span className="text-slate-400 font-normal">(required)</span></label>
          <input type="text" value={formData.searchQuery} onChange={e => set({ searchQuery: e.target.value })} placeholder="e.g., 藍牙耳機, iPhone case" className={INPUT_CLS} />
          <SuggestionChips label="Example searches" suggestions={SUGGESTIONS.shopee?.searchTerms || []} onSelect={v => set({ searchQuery: v })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={formData.category} onChange={e => set({ category: e.target.value })} placeholder="e.g., 手機/3C" className={INPUT_CLS} />
          <SuggestionChips label="Categories" suggestions={SUGGESTIONS.shopee?.categories || []} onSelect={v => set({ category: v })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Brand <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={formData.brand} onChange={e => set({ brand: e.target.value })} placeholder="e.g., Apple, Nike" className={INPUT_CLS} />
          <SuggestionChips label="Popular brands" suggestions={SUGGESTIONS.shopee?.brands || []} onSelect={v => set({ brand: v })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Shop / Seller <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={formData.shopName} onChange={e => set({ shopName: e.target.value })} placeholder="e.g., official brand store" className={INPUT_CLS} />
        </div>
        <PriceRangeField formData={formData} set={set} currency={formData.currency} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Min Star Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => set({ minRating: formData.minRating === String(n) ? '' : String(n) })} className={`p-1.5 rounded transition-colors ${parseInt(formData.minRating) >= n ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-300'}`}>
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
            {formData.minRating && <span className="ml-1 text-sm text-slate-600">{formData.minRating}+</span>}
          </div>
        </div>
      </div>
    );
  }

  if (p === 'custom') {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Website URL <span className="text-slate-400 font-normal">(required — paste the search results page)</span></label>
          <input type="url" value={formData.url} onChange={e => set({ url: e.target.value })} placeholder="https://example.com/search?q=product" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Search Keyword <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={formData.searchQuery} onChange={e => set({ searchQuery: e.target.value })} placeholder="e.g., iPhone 16" className={INPUT_CLS} />
        </div>
        <PriceRangeField formData={formData} set={set} />
        <KeywordsField formData={formData} set={set} addKeyword={addKeyword} removeKeyword={removeKeyword} platform={p} />
        <div>
          <button type="button" onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Advanced scraper hints
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">CSS Selector <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={formData.cssSelector} onChange={e => set({ cssSelector: e.target.value })} placeholder=".product-item, [data-type='result']" className={INPUT_CLS} spellCheck={false} />
                <p className="mt-1 text-xs text-slate-400">Helps the scraper locate product listings on the page.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Search Keyword <span className="text-slate-400 font-normal">(required)</span></label>
        <input type="text" value={formData.searchQuery} onChange={e => set({ searchQuery: e.target.value })} placeholder={p === 'momo' ? 'e.g., iPhone 16, Dyson 吸塵器' : 'e.g., RTX 4060, MacBook Air'} className={INPUT_CLS} />
        <SuggestionChips label="Example searches" suggestions={SUGGESTIONS[p]?.searchTerms || []} onSelect={v => set({ searchQuery: v })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Category <span className="text-slate-400 font-normal">(optional)</span></label>
        <input type="text" value={formData.category} onChange={e => set({ category: e.target.value })} placeholder={p === 'momo' ? 'e.g., 手機/相機' : 'e.g., 電腦/筆電'} className={INPUT_CLS} />
        <SuggestionChips label="Categories" suggestions={SUGGESTIONS[p]?.categories || []} onSelect={v => set({ category: v })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Brand <span className="text-slate-400 font-normal">(optional)</span></label>
        <input type="text" value={formData.brand} onChange={e => set({ brand: e.target.value })} placeholder="e.g., Apple, Sony" className={INPUT_CLS} />
        <SuggestionChips label="Popular brands" suggestions={SUGGESTIONS[p]?.brands || []} onSelect={v => set({ brand: v })} />
      </div>
      <PriceRangeField formData={formData} set={set} currency={formData.currency} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set({ inStockOnly: !formData.inStockOnly })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.inStockOnly ? 'bg-indigo-600' : 'bg-slate-200'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.inStockOnly ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <label className="text-sm font-medium text-slate-700">In-stock only</label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test result type
// ---------------------------------------------------------------------------

type TestResult = {
  success: boolean;
  found: number | null;
  items: Array<{ title: string; price: string; url: string; image?: string; location?: string; area?: string }>;
  searchUrl: string;
  message?: string;
  error?: string;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NewAlertPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Test check state
  const [testState, setTestState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const set = (patch: Partial<FormData>) => setFormData(prev => ({ ...prev, ...patch }));

  // -------------------------------------------------------------------------
  // URL detection
  // -------------------------------------------------------------------------

  const handleUrlChange = (url: string) => {
    const platform = url.trim() ? detectPlatform(url.trim()) : null;
    if (!platform) {
      set({ url, platform: null });
      return;
    }
    const { searchQuery, asin, currency } = extractFromUrl(url.trim(), platform);
    const suggestedName = !formData.name && searchQuery
      ? `${PLATFORMS[platform].label}: ${searchQuery}`
      : formData.name;
    set({ url, platform, searchQuery, asin, currency, name: suggestedName });
  };

  const handlePlatformSelect = (platform: Platform) => {
    set({
      platform,
      currency: PLATFORMS[platform].currency,
      url: '',
      searchQuery: '',
      asin: '',
    });
    setTestState('idle');
    setTestResult(null);
  };

  // -------------------------------------------------------------------------
  // Keyword helpers
  // -------------------------------------------------------------------------

  const addKeyword = () => {
    const kw = formData.keywordInput.trim();
    if (kw && !formData.keywords.includes(kw)) {
      set({ keywords: [...formData.keywords, kw], keywordInput: '' });
    }
  };

  const removeKeyword = (kw: string) =>
    set({ keywords: formData.keywords.filter(k => k !== kw) });

  // -------------------------------------------------------------------------
  // Test check
  // -------------------------------------------------------------------------

  const canTest = !formData.platform ? false
    : formData.platform === '591' ? true
    : formData.platform === 'custom' ? !!formData.url
    : formData.platform === 'amazon' ? !!(formData.searchQuery || formData.asin)
    : !!formData.searchQuery;

  // Helper to safely parse JSON response
  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If we get HTML, it's likely a redirect to login
      if (contentType?.includes('text/html')) {
        throw new Error('Session expired or not logged in. Please log in to continue.');
      }
      throw new Error('Invalid response format from server.');
    }
    return response.json();
  };

  const runTestCheck = async () => {
    if (!formData.platform || !canTest) return;
    const token = getAuthToken();
    if (!token) {
      setTestResult({
        success: false,
        found: null,
        items: [],
        searchUrl: '',
        error: 'Please log in to run the test.',
      });
      return;
    }
    setTestState('loading');
    setTestResult(null);

    try {
      const p = formData.platform;

      let criteria: Record<string, unknown>;
      if (p === '591') {
        criteria = {
          city: formData.city,
          districts: formData.districts,
          minPrice: formData.minPrice ? parseInt(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseInt(formData.maxPrice) : undefined,
          minPing: formData.minPing ? parseFloat(formData.minPing) : undefined,
          maxPing: formData.maxPing ? parseFloat(formData.maxPing) : undefined,
          rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
          keywords: formData.keywords,
        };
      } else {
        criteria = {
          url: formData.url || undefined,
          platform: p,
          searchQuery: formData.searchQuery || undefined,
          category: formData.category || undefined,
          brand: formData.brand ? [formData.brand] : undefined,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          currency: formData.currency,
          asin: formData.asin || undefined,
          condition: formData.condition !== 'any' ? formData.condition : undefined,
          inStockOnly: formData.inStockOnly || undefined,
          shopName: formData.shopName || undefined,
          cssSelector: formData.cssSelector || undefined,
          keywords: formData.keywords.length ? formData.keywords : undefined,
        };
      }

      const response = await fetch('/api/alerts/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform: p, criteria }),
      });

      const data = await parseJsonResponse(response);
      if (response.status === 401) {
        setTestResult({
          success: false,
          found: null,
          items: [],
          searchUrl: '',
          error: data.error === 'Unauthorized' ? 'Session expired or not logged in. Please log in to run the test.' : data.error,
        });
        return;
      }
      setTestResult(data);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        found: null,
        items: [],
        searchUrl: '',
        error: err instanceof Error ? err.message : 'Network error. Please check your connection.',
      });
    } finally {
      setTestState('done');
    }
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform) {
      setError('Please select a platform.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const p = formData.platform;
      const type = PLATFORMS[p].type;

      let criteria: Record<string, unknown>;
      if (p === '591') {
        criteria = {
          city: formData.city,
          districts: formData.districts,
          minPrice: formData.minPrice ? parseInt(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseInt(formData.maxPrice) : undefined,
          minPing: formData.minPing ? parseFloat(formData.minPing) : undefined,
          maxPing: formData.maxPing ? parseFloat(formData.maxPing) : undefined,
          rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
          keywords: formData.keywords,
        };
      } else {
        criteria = {
          platform: p,
          url: formData.url || undefined,
          searchQuery: formData.searchQuery || undefined,
          category: formData.category || undefined,
          brand: formData.brand ? [formData.brand] : undefined,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          currency: formData.currency,
          inStockOnly: formData.inStockOnly || undefined,
          keywords: formData.keywords.length ? formData.keywords : undefined,
          ...(p === 'amazon' && {
            asin: formData.asin || undefined,
            condition: formData.condition !== 'any' ? formData.condition : undefined,
            minRating: formData.minRating ? parseFloat(formData.minRating) : undefined,
            primeOnly: formData.primeOnly || undefined,
          }),
          ...(p === 'shopee' && { shopName: formData.shopName || undefined }),
          ...(p === 'custom' && { cssSelector: formData.cssSelector || undefined }),
        };
      }

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          name: formData.name,
          criteria,
          sources: [p],
          checkFrequency: formData.checkFrequency,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create alert');
        } else {
          // HTML response likely means redirect to login
          throw new Error('Session expired or not logged in. Please log in to continue.');
        }
      }

      router.push('/alerts');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Step validation
  // -------------------------------------------------------------------------

  const step1Valid = !!formData.name && !!formData.platform;
  const step2Valid = formData.platform === '591'
    ? true
    : formData.platform === 'custom'
      ? !!formData.url
      : formData.platform === 'amazon'
        ? !!(formData.searchQuery || formData.asin)
        : !!formData.searchQuery;

  const platformFormProps = {
    formData,
    set,
    addKeyword,
    removeKeyword,
    showAdvanced,
    setShowAdvanced,
  };

  // -------------------------------------------------------------------------
  // Step 3 summary
  // -------------------------------------------------------------------------

  const SummaryRow = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex justify-between">
        <dt className="text-slate-600">{label}:</dt>
        <dd className="font-medium text-slate-900 text-right max-w-[60%] truncate">{value}</dd>
      </div>
    ) : null;

  const AlertSummary = () => {
    const p = formData.platform;
    const pDef = p ? PLATFORMS[p] : null;
    return (
      <div className="bg-indigo-50 p-4 rounded-xl">
        <h3 className="font-semibold text-indigo-900 mb-2">Alert Summary</h3>
        <dl className="space-y-1 text-sm">
          <SummaryRow label="Name" value={formData.name} />
          <SummaryRow label="Platform" value={pDef?.label} />
          {p === '591' && (
            <>
              <SummaryRow label="City" value={CITIES.find(c => c.value === formData.city)?.label} />
              {(formData.minPrice || formData.maxPrice) && (
                <SummaryRow label="Price" value={`${formData.minPrice || '0'} – ${formData.maxPrice || '∞'} TWD`} />
              )}
            </>
          )}
          {p !== '591' && p && (
            <>
              <SummaryRow label="Search" value={formData.searchQuery || formData.asin} />
              {(formData.minPrice || formData.maxPrice) && (
                <SummaryRow label="Price" value={`${formData.minPrice || '0'} – ${formData.maxPrice || '∞'} ${formData.currency}`} />
              )}
            </>
          )}
          <SummaryRow label="Frequency" value={FREQUENCIES.find(f => f.value === formData.checkFrequency)?.label} />
        </dl>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Alert Scout</span>
              </div>
            </div>
            <div className="text-sm text-slate-600">Create New Alert</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
        >
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((s, i) => (
                <div key={s} className="contents">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${
                      step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s}
                  </div>
                  {i < 2 && <div className={`flex-1 h-1 ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-slate-600">
              <span>Platform & Name</span>
              <span>Search Criteria</span>
              <span>Schedule</span>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ----------------------------------------------------------------
                Step 1 — Platform & Name
            ---------------------------------------------------------------- */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste a URL <span className="text-slate-400 font-normal">(optional — auto-detects platform)</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={e => handleUrlChange(e.target.value)}
                      placeholder="https://www.momoshop.com.tw/search/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Platform</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PLATFORM_ORDER.map(pid => {
                      const def = PLATFORMS[pid];
                      const Icon = def.icon;
                      const selected = formData.platform === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => handlePlatformSelect(pid)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 text-center ${
                            selected
                              ? `${def.borderColor} ${def.bgColor} ${def.textColor}`
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-semibold leading-tight">{def.label}</span>
                          <span className="text-[10px] text-slate-400 leading-tight">{def.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alert Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => set({ name: e.target.value })}
                    required
                    placeholder={
                      formData.platform === '591'
                        ? 'e.g., Hsinchu 2BR Apartment'
                        : formData.platform
                          ? `e.g., ${PLATFORMS[formData.platform].label}: iPhone 16`
                          : 'e.g., My price alert'
                    }
                    className={INPUT_CLS}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* ----------------------------------------------------------------
                Step 2 — Criteria (dynamic per platform)
            ---------------------------------------------------------------- */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {/* Platform badge */}
                {formData.platform && (() => {
                  const def = PLATFORMS[formData.platform];
                  const Icon = def.icon;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${def.bgColor} ${def.textColor} w-fit`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{def.label}</span>
                    </div>
                  );
                })()}

                <PlatformCriteriaForm {...platformFormProps} />

                {/* ---- Test Check ---- */}
                <div className="rounded-xl border border-dashed border-slate-300 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-slate-800 text-sm">Test this search</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify your settings before saving the alert
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={runTestCheck}
                      disabled={testState === 'loading' || !canTest}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {testState === 'loading' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
                      ) : (
                        <><Play className="h-4 w-4" /> Run Test</>
                      )}
                    </button>
                  </div>

                  {/* Test results */}
                  <AnimatePresence>
                    {testState === 'done' && testResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-200"
                      >
                        {/* Status line */}
                        <div className={`flex items-center gap-2 text-sm font-medium mb-3 ${testResult.success ? 'text-green-700' : 'text-red-600'}`}>
                          {testResult.success
                            ? <CheckCircle className="h-4 w-4 shrink-0" />
                            : <XCircle className="h-4 w-4 shrink-0" />
                          }
                          <span>
                            {formData.platform === '591'
                              ? testResult.success
                                ? `Found ${testResult.found} listing${testResult.found !== 1 ? 's' : ''} matching your criteria`
                                : testResult.error
                              : testResult.success
                                ? testResult.message || 'Platform is reachable'
                                : testResult.error
                            }
                          </span>
                        </div>

                        {/* 591 result cards */}
                        {formData.platform === '591' && (testResult.items?.length ?? 0) > 0 && (
                          <div className="grid gap-2">
                            {(testResult.items ?? []).map((item, i) => (
                              <a
                                key={i}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                              >
                                {item.image ? (
                                  <img src={item.image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                                  <p className="text-xs text-slate-500">{item.price} · {item.location}</p>
                                </div>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* 591 no results */}
                        {formData.platform === '591' && testResult.success && testResult.found === 0 && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                            No listings found. Try broadening your criteria (wider price range, different city or fewer filters).
                          </p>
                        )}

                        {/* Non-591: show search URL */}
                        {formData.platform !== '591' && testResult.searchUrl && (
                          <div className="text-xs">
                            <p className="text-slate-500 mb-1">URL that will be monitored:</p>
                            <a
                              href={testResult.searchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 break-all"
                            >
                              {testResult.searchUrl.length > 80 ? testResult.searchUrl.slice(0, 77) + '…' : testResult.searchUrl}
                              <ExternalLink className="h-3 w-3 shrink-0 ml-0.5" />
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!step2Valid}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* ----------------------------------------------------------------
                Step 3 — Schedule
            ---------------------------------------------------------------- */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check Frequency</label>
                  <div className="space-y-2">
                    {FREQUENCIES.map(freq => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => set({ checkFrequency: freq.value })}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          formData.checkFrequency === freq.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-medium text-slate-900">{freq.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.platform && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Data Source</label>
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-indigo-600 bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-700">{PLATFORMS[formData.platform].label}</span>
                    </div>
                  </div>
                )}

                <AlertSummary />

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Creating...</>
                    ) : (
                      'Create Alert'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </main>
    </div>
  );
}
