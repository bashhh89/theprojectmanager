-- Enable UUID generation if not already enabled
create extension if not exists "uuid-ossp" with schema extensions;

-- Create moddatetime function if it doesn't exist (for updated_at triggers)
create or replace function extensions.moddatetime()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Brands Table (Create if not exists to ensure dependency for websites table)
create table if not exists public.brands (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null default 'Untitled Brand',
  -- Placeholder for brand details (e.g., visual_identity jsonb, voice_tone jsonb)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on Brands table (might already be enabled if table existed partially)
do $$
begin
  if exists (select 1 from pg_class where relname = 'brands' and relkind = 'r') then
     alter table public.brands enable row level security;
  end if;
end; $$;

-- Policies for Brands (Create if they don't exist - ignore errors if they do)
do $$ begin create policy "Allow users to view their own brands" on public.brands for select using (auth.uid() = user_id); exception when duplicate_object then null; end; $$;
do $$ begin create policy "Allow users to insert their own brands" on public.brands for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end; $$;
do $$ begin create policy "Allow users to update their own brands" on public.brands for update using (auth.uid() = user_id); exception when duplicate_object then null; end; $$;
do $$ begin create policy "Allow users to delete their own brands" on public.brands for delete using (auth.uid() = user_id); exception when duplicate_object then null; end; $$;

-- Trigger for Brands (Create if it doesn't exist)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'handle_brands_updated_at' and tgrelid = 'public.brands'::regclass) then
     create trigger handle_brands_updated_at before update on public.brands
       for each row execute procedure extensions.moddatetime (updated_at);
  end if;
end; $$;

-- Index for Brands (Create if it doesn't exist)
create index if not exists idx_brands_user_id on public.brands(user_id);

-- Websites Table
create table public.websites (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null default 'Untitled Site',
  subdomain text unique,
  custom_domain text,
  brand_id uuid references public.brands(id) on delete set null, -- Optional link to brand
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.websites enable row level security;

-- Policy: Users can view their own websites
create policy "Allow users to view their own websites" on public.websites
  for select using (auth.uid() = user_id);

-- Policy: Users can insert their own websites
create policy "Allow users to insert their own websites" on public.websites
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own websites
create policy "Allow users to update their own websites" on public.websites
  for update using (auth.uid() = user_id);

-- Policy: Users can delete their own websites
create policy "Allow users to delete their own websites" on public.websites
  for delete using (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
create trigger handle_updated_at before update on public.websites
  for each row execute procedure extensions.moddatetime (updated_at);

-- Pages Table
create table public.pages (
  id uuid primary key default extensions.uuid_generate_v4(),
  website_id uuid references public.websites(id) on delete cascade not null,
  name text not null default 'Untitled Page',
  slug text not null default '/',
  content jsonb, -- Store page structure, components, text blocks, etc.
  is_homepage boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Ensure unique slug per site
  unique (website_id, slug)
);

-- Index to ensure only one homepage per site (Correct way to handle partial uniqueness)
CREATE UNIQUE INDEX if not exists idx_pages_single_homepage ON public.pages (website_id) WHERE is_homepage IS TRUE;

-- Enable Row Level Security (RLS)
alter table public.pages enable row level security;

-- Function to check if user owns the website associated with a page
create or replace function public.user_owns_website(page_website_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.websites w
    where w.id = page_website_id and w.user_id = auth.uid()
  );
$$;

-- Policy: Users can view pages belonging to their own websites
create policy "Allow users to view pages of their websites" on public.pages
  for select using (public.user_owns_website(website_id));

-- Policy: Users can insert pages for their own websites
create policy "Allow users to insert pages for their websites" on public.pages
  for insert with check (public.user_owns_website(website_id));

-- Policy: Users can update pages belonging to their own websites
create policy "Allow users to update pages of their websites" on public.pages
  for update using (public.user_owns_website(website_id));

-- Policy: Users can delete pages belonging to their own websites
create policy "Allow users to delete pages of their websites" on public.pages
  for delete using (public.user_owns_website(website_id));

-- Trigger to update updated_at timestamp
create trigger handle_updated_at before update on public.pages
  for each row execute procedure extensions.moddatetime (updated_at);

-- Indexes
create index idx_pages_website_id on public.pages(website_id);
create index idx_websites_user_id on public.websites(user_id); 