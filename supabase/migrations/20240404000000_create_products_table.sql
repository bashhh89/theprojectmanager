-- Create products table for storing product/service library
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features JSONB,  -- Array of product features
    benefits JSONB,  -- Array of product benefits
    standard_scope TEXT,  -- What's typically included
    pricing_model JSONB,  -- Pricing information (can include multiple tiers)
    tags TEXT[],    -- For categorization
    image_url TEXT, -- Optional product image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own products
CREATE POLICY "Users can view their own products"
    ON public.products
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own products
CREATE POLICY "Users can insert their own products"
    ON public.products
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own products
CREATE POLICY "Users can update their own products"
    ON public.products
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for users to delete their own products
CREATE POLICY "Users can delete their own products"
    ON public.products
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create products_categories table for organizing products
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for product categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own categories
CREATE POLICY "Users can view their own product categories"
    ON public.product_categories
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own categories
CREATE POLICY "Users can insert their own product categories"
    ON public.product_categories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own categories
CREATE POLICY "Users can update their own product categories"
    ON public.product_categories
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for users to delete their own product categories
CREATE POLICY "Users can delete their own product categories"
    ON public.product_categories
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create product_category_map junction table
CREATE TABLE IF NOT EXISTS public.product_category_map (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Add RLS policies for product category mapping
ALTER TABLE public.product_category_map ENABLE ROW LEVEL SECURITY;

-- Policy for viewing product category mappings
CREATE POLICY "Users can view product category mappings"
    ON public.product_category_map
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.user_id = auth.uid()
        )
    );

-- Policy for inserting product category mappings
CREATE POLICY "Users can insert product category mappings"
    ON public.product_category_map
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.user_id = auth.uid()
        )
    );

-- Policy for deleting product category mappings
CREATE POLICY "Users can delete product category mappings"
    ON public.product_category_map
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 