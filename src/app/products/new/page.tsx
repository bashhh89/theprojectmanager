"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductNav } from "@/components/products/ProductNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Loader2, Globe, Wand2 } from "lucide-react";
import Link from "next/link";
import { useProductStore, ProductInput, ProductFeature, ProductBenefit, PricingTier } from "@/store/productStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createProduct, generateProductDescription } = useProductStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [formData, setFormData] = useState<ProductInput>({
    name: "",
    description: "",
    features: [],
    benefits: [],
    standardScope: "",
    pricingModel: [{ name: "Standard", price: 0, billingCycle: "one-time" }],
    tags: [],
  });

  const [newTag, setNewTag] = useState("");
  const [newFeature, setNewFeature] = useState<ProductFeature>({ title: "", description: "" });
  const [newBenefit, setNewBenefit] = useState<ProductBenefit>({ title: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productId = await createProduct(formData);
      toast({
        title: "Product Created",
        description: "Your product has been added successfully.",
      });
      router.push(`/products/${productId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.title.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, { ...newFeature }],
      }));
      setNewFeature({ title: "", description: "" });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.title.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, { ...newBenefit }],
      }));
      setNewBenefit({ title: "", description: "" });
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handlePricingChange = (index: number, field: keyof PricingTier, value: any) => {
    setFormData((prev) => {
      const newPricing = [...prev.pricingModel];
      newPricing[index] = {
        ...newPricing[index],
        [field]: field === 'price' ? parseFloat(value) || 0 : value,
      };
      return { ...prev, pricingModel: newPricing };
    });
  };

  const handleAddPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingModel: [
        ...prev.pricingModel,
        { name: `Tier ${prev.pricingModel.length + 1}`, price: 0, billingCycle: "one-time" },
      ],
    }));
  };

  const handleRemovePricingTier = (index: number) => {
    if (formData.pricingModel.length > 1) {
      setFormData((prev) => ({
        ...prev,
        pricingModel: prev.pricingModel.filter((_, i) => i !== index),
      }));
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a product name first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = formData.name;
      const industry = formData.tags.length > 0 ? formData.tags[0] : '';

      const response = await fetch('/api/generate-product-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          industry
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const productData = await response.json();
      
      // Update form with all the generated data
      setFormData((prev) => ({
        ...prev,
        description: productData.description || prev.description,
        features: productData.features || prev.features,
        benefits: productData.benefits || prev.benefits,
        standardScope: productData.standardScope || prev.standardScope,
        tags: Array.from(new Set([...prev.tags, ...(productData.tags || [])])),
        pricingModel: productData.pricingModel || prev.pricingModel,
      }));
      
      toast({
        title: "Product Information Generated",
        description: "AI has created complete product details based on your input.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate product information",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScrapeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL.",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingWebsite(true);
    try {
      // Call the API to scrape the website
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to scrape website: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Use the scraped data to populate form fields
      if (data.scrapedData) {
        const { title, description, keyPhrases, industryHints } = data.scrapedData;
        
        // Update form with scraped data
        setFormData(prev => ({
          ...prev,
          name: title || prev.name,
          description: description || prev.description,
          tags: [...new Set([...prev.tags, ...industryHints])],
        }));

        // Extract potential features from key phrases
        if (keyPhrases && keyPhrases.length > 0) {
          const newFeatures = keyPhrases.slice(0, 3).map(phrase => ({
            title: phrase,
            description: ""
          }));
          
          setFormData(prev => ({
            ...prev,
            features: [...prev.features, ...newFeatures]
          }));
        }
      }
      
      toast({
        title: "Website Scraped",
        description: "Information has been extracted and added to the form.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scrape website",
        variant: "destructive",
      });
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <ProductNav />
        </div>
        <div className="col-span-9">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/products">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Product or Service</CardTitle>
                <CardDescription>
                  Add details about your product or service offering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product/Service Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Import from Website (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="website"
                        placeholder="https://example.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleScrapeWebsite}
                        disabled={isScrapingWebsite || !websiteUrl}
                      >
                        {isScrapingWebsite ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Globe className="h-4 w-4 mr-2" />
                        )}
                        Import
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating || !formData.name}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags/Categories</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add tag and press Enter"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  List the key features of your product or service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-4 items-start border rounded-md p-3">
                    <div className="flex-1">
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {feature.description}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Feature title"
                    value={newFeature.title}
                    onChange={(e) =>
                      setNewFeature((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Brief description"
                      value={newFeature.description}
                      onChange={(e) =>
                        setNewFeature((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                    <Button type="button" onClick={handleAddFeature}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
                <CardDescription>
                  Describe the benefits clients receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start border rounded-md p-3">
                    <div className="flex-1">
                      <div className="font-medium">{benefit.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {benefit.description}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Benefit title"
                    value={newBenefit.title}
                    onChange={(e) =>
                      setNewBenefit((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Brief description"
                      value={newBenefit.description}
                      onChange={(e) =>
                        setNewBenefit((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                    <Button type="button" onClick={handleAddBenefit}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Standard Scope</CardTitle>
                <CardDescription>
                  What's typically included in this offering?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="standardScope"
                  rows={4}
                  value={formData.standardScope}
                  onChange={handleChange}
                  placeholder="Describe what is typically included in the standard scope for this product or service"
                />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>
                    Set pricing tiers for your product or service
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPricingTier}
                >
                  Add Tier
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.pricingModel.map((tier, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 items-center border rounded-md p-3"
                  >
                    <div className="col-span-4">
                      <Label htmlFor={`tier-name-${index}`}>Name</Label>
                      <Input
                        id={`tier-name-${index}`}
                        value={tier.name}
                        onChange={(e) =>
                          handlePricingChange(index, "name", e.target.value)
                        }
                        placeholder="Tier name"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor={`tier-price-${index}`}>Price</Label>
                      <Input
                        id={`tier-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.price}
                        onChange={(e) =>
                          handlePricingChange(index, "price", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor={`tier-cycle-${index}`}>Billing Cycle</Label>
                      <select
                        id={`tier-cycle-${index}`}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={tier.billingCycle}
                        onChange={(e) =>
                          handlePricingChange(index, "billingCycle", e.target.value)
                        }
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => handleRemovePricingTier(index)}
                        disabled={formData.pricingModel.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Product
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 