"use client";

import { useEffect, useState } from "react";
import { ProductNav } from "@/components/products/ProductNav";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";

export default function ProductsPage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    fetchProducts();
    setIsClient(true);
  }, [fetchProducts]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <ProductNav />
        </div>
        <div className="col-span-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Products & Services</h1>
              <p className="text-muted-foreground">
                Manage your offerings and use them in proposals
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 rounded-md">
              <Link href="/products/new">
                Add Product
              </Link>
            </button>
          </div>

          {isLoading ? (
            <div>Loading products...</div>
          ) : error ? (
            <div className="flex justify-center p-8">
              <div className="bg-red-500/20 text-red-500 p-4 rounded-md">
                Error loading products: {error}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Create products and services to include in your proposals and presentations.
              </p>
              <button className="px-4 py-2 bg-blue-600 rounded-md">
                <Link href="/products/new">Add your first product</Link>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    <p className="text-zinc-400 line-clamp-2">{product.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 