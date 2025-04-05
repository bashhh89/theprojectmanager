"use client";

import { useEffect, useState } from "react";
import { ProductNav } from "@/components/products/ProductNav";
import { useProductStore } from "@/store/productStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, Package } from "lucide-react";

export default function ProductAnalyticsPage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    fetchProducts();
    setIsClient(true);
  }, [fetchProducts]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const totalProducts = products.length;
  const totalPricingTiers = products.reduce((acc, product) => 
    acc + (product.pricing_model?.length || 0), 0);
  
  // Placeholder stats since we don't have actual analytics data yet
  const avgPrice = products.length > 0 
    ? Math.round(products.reduce((acc, product) => {
        const prices = product.pricing_model?.map(tier => tier.price) || [];
        const avgProductPrice = prices.length > 0 
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
          : 0;
        return acc + avgProductPrice;
      }, 0) / products.length)
    : 0;

  return (
    <div className="container py-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <ProductNav />
        </div>
        <div className="col-span-9">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Product Analytics</h1>
            <p className="text-muted-foreground">
              Insights and statistics about your product catalog
            </p>
          </div>

          {isLoading ? (
            <div>Loading analytics...</div>
          ) : error ? (
            <div className="flex justify-center p-8">
              <div className="bg-red-500/20 text-red-500 p-4 rounded-md">
                Error loading data: {error}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No product data available</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Add products to view analytics and insights about your catalog.
              </p>
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Products
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pricing Tiers
                    </CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPricingTiers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg. Price
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${avgPrice}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Product Growth
                    </CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+{totalProducts}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Popular products */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Popular Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {product.pricing_model && product.pricing_model.length > 0
                              ? `$${product.pricing_model[0].price} / ${product.pricing_model[0].billingCycle}`
                              : "No pricing available"}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {/* Placeholder for actual stats */}
                          {Math.floor(Math.random() * 100)} views
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity - placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center border-b pb-2">
                        <div className="mr-4 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">Product Created: {product.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {new Date(product.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 