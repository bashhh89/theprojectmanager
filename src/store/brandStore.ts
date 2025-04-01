import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandProfile } from '@/types/brand';

// Default sample brand
const sampleBrand: BrandProfile = {
  id: 'sample-brand',
  name: 'Quantum Innovations',
  createdAt: new Date(),
  updatedAt: new Date(),
  visualIdentity: {
    logos: {
      primary: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=QI',
      alternate: ['https://placehold.co/400x400/111827/FFFFFF?text=QI'],
    },
    colorPalette: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#F59E0B',
      text: '#111827',
      background: '#FFFFFF',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      monoFont: 'Consolas',
      headingWeight: 600,
      bodyWeight: 400,
      baseSize: '16px',
    },
    imageStyle: {
      style: 'photographic',
      filterStyle: 'brightness(1.1) contrast(1.05)',
      colorTreatment: 'vibrant',
      cornerStyle: 'rounded',
      preferredSubjects: ['Technology', 'Innovation', 'People working'],
    },
  },
  voice: {
    tone: ['Professional', 'Innovative', 'Confident', 'Clear'],
    vocabulary: {
      preferred: ['solutions', 'innovation', 'cutting-edge', 'transform', 'empower'],
      avoided: ['cheap', 'problems', 'complicated', 'difficult', 'basic'],
    },
    examples: [
      'Our cutting-edge solutions empower businesses to transform their operations through innovative technology.',
      'We partner with forward-thinking organizations to deliver exceptional results in a rapidly evolving landscape.',
    ],
  },
  positioning: {
    valueProposition: 'We help forward-thinking businesses transform their operations through AI-powered solutions that increase efficiency and drive growth.',
    targetAudiences: ['Enterprise Technology Leaders', 'Mid-sized Business Owners', 'Digital Transformation Teams'],
    competitiveAdvantages: [
      'Proprietary AI algorithms', 
      'Industry-leading implementation time', 
      'Dedicated customer success team'
    ],
    industryPosition: 'Market innovator',
  },
  contactInfo: {
    website: 'https://example.com',
    email: 'contact@example.com',
    phone: '+1 (555) 123-4567',
  },
};

interface BrandState {
  brands: BrandProfile[];
  activeBrandId: string | null;
  setActiveBrand: (brandId: string) => void;
  addBrand: (brand: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBrand: (brandId: string, updates: Partial<BrandProfile>) => void;
  deleteBrand: (brandId: string) => void;
  getBrandById: (brandId: string) => BrandProfile | undefined;
  getActiveBrand: () => BrandProfile | undefined;
  selectBrand: (brandIdOrQuery?: string | null) => BrandProfile | undefined;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      brands: [sampleBrand],
      activeBrandId: 'sample-brand',
      
      setActiveBrand: (brandId: string) => {
        set({ activeBrandId: brandId });
      },
      
      addBrand: (brandData) => {
        const id = `brand-${Date.now()}`;
        const now = new Date();
        
        const newBrand: BrandProfile = {
          ...brandData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          brands: [...state.brands, newBrand],
          activeBrandId: id, // Set new brand as active
        }));
        
        return id;
      },
      
      updateBrand: (brandId, updates) => {
        set((state) => ({
          brands: state.brands.map((brand) => 
            brand.id === brandId
              ? { 
                  ...brand, 
                  ...updates, 
                  updatedAt: new Date() 
                }
              : brand
          ),
        }));
      },
      
      deleteBrand: (brandId) => {
        set((state) => {
          // Don't allow deleting the last brand
          if (state.brands.length <= 1) {
            return state;
          }
          
          const newBrands = state.brands.filter(brand => brand.id !== brandId);
          
          // If active brand is being deleted, set another brand as active
          const newActiveBrandId = 
            state.activeBrandId === brandId 
              ? newBrands[0]?.id || null
              : state.activeBrandId;
          
          return {
            brands: newBrands,
            activeBrandId: newActiveBrandId,
          };
        });
      },
      
      getBrandById: (brandId) => {
        return get().brands.find(brand => brand.id === brandId);
      },
      
      getActiveBrand: () => {
        const { brands, activeBrandId } = get();
        return brands.find(brand => brand.id === activeBrandId);
      },
      
      selectBrand: (brandIdOrQuery) => {
        // If no ID provided, return active brand
        if (!brandIdOrQuery) {
          return get().getActiveBrand();
        }
        
        // Try to find brand by ID
        const brandById = get().getBrandById(brandIdOrQuery);
        if (brandById) {
          return brandById;
        }
        
        // If not found by ID, try to find by name
        const { brands } = get();
        const brandByName = brands.find(brand => 
          brand.name.toLowerCase().includes(brandIdOrQuery.toLowerCase())
        );
        
        // Return found brand or active brand as fallback
        return brandByName || get().getActiveBrand();
      }
    }),
    {
      name: 'brand-storage',
    }
  )
); 