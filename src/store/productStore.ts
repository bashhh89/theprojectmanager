import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface ProductFeature {
  title: string;
  description: string;
}

export interface ProductBenefit {
  title: string;
  description: string;
}

export interface PricingTier {
  name: string;
  price: number | string;
  billingCycle?: 'one-time' | 'monthly' | 'yearly' | 'custom';
  description?: string;
  features?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  features: ProductFeature[];
  benefits: ProductBenefit[];
  standardScope: string;
  pricingModel: PricingTier[];
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Type for product creation without ID and timestamps
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategoryInput = Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>;

interface ProductStore {
  // State
  products: Product[];
  categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  
  // Product Actions
  fetchProducts: () => Promise<void>;
  createProduct: (product: ProductInput) => Promise<string>;
  updateProduct: (id: string, product: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Category Actions
  fetchCategories: () => Promise<void>;
  createCategory: (category: ProductCategoryInput) => Promise<string>;
  updateCategory: (id: string, category: Partial<ProductCategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Category-Product Mapping
  assignProductToCategory: (productId: string, categoryId: string) => Promise<void>;
  removeProductFromCategory: (productId: string, categoryId: string) => Promise<void>;
  
  // Generate AI-assisted product description
  generateProductDescription: (prompt: string) => Promise<string>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  
  // Product Actions
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the database results to match our Product interface
      const transformedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        features: product.features || [],
        benefits: product.benefits || [],
        standardScope: product.standard_scope || '',
        pricingModel: product.pricing_model || [],
        tags: product.tags || [],
        imageUrl: product.image_url || undefined,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
      
      set({ products: transformedProducts, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  createProduct: async (productInput) => {
    set({ isLoading: true, error: null });
    try {
      // Transform the input to match the database schema
      const productData = {
        name: productInput.name,
        description: productInput.description,
        features: productInput.features,
        benefits: productInput.benefits,
        standard_scope: productInput.standardScope,
        pricing_model: productInput.pricingModel,
        tags: productInput.tags,
        image_url: productInput.imageUrl
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create product');
      
      // Transform the response to match our Product interface
      const newProduct = {
        id: data.id,
        name: data.name,
        description: data.description,
        features: data.features || [],
        benefits: data.benefits || [],
        standardScope: data.standard_scope || '',
        pricingModel: data.pricing_model || [],
        tags: data.tags || [],
        imageUrl: data.image_url || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Update local state
      const { products } = get();
      set({ 
        products: [newProduct, ...products],
        isLoading: false
      });
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating product:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  updateProduct: async (id, productUpdate) => {
    set({ isLoading: true, error: null });
    try {
      // Transform the input to match the database schema
      const updateData: Record<string, any> = {};
      
      if (productUpdate.name !== undefined) updateData.name = productUpdate.name;
      if (productUpdate.description !== undefined) updateData.description = productUpdate.description;
      if (productUpdate.features !== undefined) updateData.features = productUpdate.features;
      if (productUpdate.benefits !== undefined) updateData.benefits = productUpdate.benefits;
      if (productUpdate.standardScope !== undefined) updateData.standard_scope = productUpdate.standardScope;
      if (productUpdate.pricingModel !== undefined) updateData.pricing_model = productUpdate.pricingModel;
      if (productUpdate.tags !== undefined) updateData.tags = productUpdate.tags;
      if (productUpdate.imageUrl !== undefined) updateData.image_url = productUpdate.imageUrl;
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { products } = get();
      const updatedProducts = products.map(product => 
        product.id === id 
          ? { ...product, ...productUpdate, updatedAt: new Date().toISOString() } 
          : product
      );
      
      set({ products: updatedProducts, isLoading: false });
    } catch (error: any) {
      console.error('Error updating product:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { products } = get();
      set({ 
        products: products.filter(product => product.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Category Actions
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: categories, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Transform the database results to match our ProductCategory interface
      const transformedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdAt: category.created_at,
        updatedAt: category.updated_at
      }));
      
      set({ categories: transformedCategories, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  createCategory: async (categoryInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([{
          name: categoryInput.name,
          description: categoryInput.description
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create category');
      
      // Transform the response
      const newCategory = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Update local state
      const { categories } = get();
      set({ 
        categories: [...categories, newCategory],
        isLoading: false 
      });
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating category:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  updateCategory: async (id, categoryUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: Record<string, any> = {};
      
      if (categoryUpdate.name !== undefined) updateData.name = categoryUpdate.name;
      if (categoryUpdate.description !== undefined) updateData.description = categoryUpdate.description;
      
      const { error } = await supabase
        .from('product_categories')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { categories } = get();
      const updatedCategories = categories.map(category => 
        category.id === id 
          ? { ...category, ...categoryUpdate, updatedAt: new Date().toISOString() } 
          : category
      );
      
      set({ categories: updatedCategories, isLoading: false });
    } catch (error: any) {
      console.error('Error updating category:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { categories } = get();
      set({ 
        categories: categories.filter(category => category.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Category-Product Mapping
  assignProductToCategory: async (productId, categoryId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('product_category_map')
        .insert([{
          product_id: productId,
          category_id: categoryId
        }]);
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error assigning product to category:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  removeProductFromCategory: async (productId, categoryId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('product_category_map')
        .delete()
        .match({
          product_id: productId,
          category_id: categoryId
        });
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error removing product from category:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Generate AI-assisted product description
  generateProductDescription: async (prompt) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/generate-product-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      set({ isLoading: false });
      
      return data.description;
    } catch (error: any) {
      console.error('Error generating product description:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
})); 