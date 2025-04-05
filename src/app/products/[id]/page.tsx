"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProductStore, Product, ProductInput, ProductFeature, ProductBenefit, PricingTier } from "@/store/productStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import NextLink from "next/link";
import { ArrowLeft, Edit, Trash, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ensureArray = <T,>(arr: T[] | undefined | null): T[] => Array.isArray(arr) ? arr : [];

// Extend ProductInput to include id for internal use
interface ProductFormData extends Partial<ProductInput> {
  id?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { fetchProducts, updateProduct, deleteProduct } = useProductStore();
  const product = useProductStore((state) => state.products.find(p => p.id === productId));
  const productsLoading = useProductStore((state) => state.isLoading);
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({});
  
  const [newFeature, setNewFeature] = useState<ProductFeature>({ title: '', description: '' });
  const [newBenefit, setNewBenefit] = useState<ProductBenefit>({ title: '', description: '' });
  const [newTag, setNewTag] = useState('');
  const [newPricingTier, setNewPricingTier] = useState<PricingTier>({ 
    name: '', price: 0, billingCycle: 'monthly', description: '' 
  });

  useEffect(() => {
    if (!product && !productsLoading && !initialFetchAttempted) {
      console.log(`[ProductDetail] Product ${productId} not found in state and not loading. Attempting fetch.`);
      setInitialFetchAttempted(true);
      fetchProducts().then(() => {
        console.log("[ProductDetail] Initial fetch complete after product not found.");
      }).catch(err => {
          console.error("[ProductDetail] Error fetching products:", err);
          toast({ title: "Error Loading", description: "Could not load product data.", variant: "destructive" });
      });
    }
  }, [fetchProducts, product, productsLoading, initialFetchAttempted, productId]);

  useEffect(() => {
    if (product) {
      if (!isEditing || formData.id !== product.id) { 
          console.log(`[ProductDetail] Product ${product.id} loaded/updated. Initializing/Resetting form data.`);
          setFormData({
            id: product.id,
            name: product.name || '',
            description: product.description || '',
            website_url: product.website_url || '',
            features: ensureArray(product.features).map(f => ({...f})),
            benefits: ensureArray(product.benefits).map(b => ({...b})),
            tags: ensureArray(product.tags).slice(),
            standard_scope: product.standard_scope || '',
            pricing_model: ensureArray(product.pricing_model).map(p => ({...p})),
          });
      }
    } else {
        setFormData({});
    }
  }, [product, isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFeature = () => {
    if (newFeature.title) {
      setFormData(prev => ({ ...prev, features: [...ensureArray(prev.features), newFeature] }));
      setNewFeature({ title: '', description: '' });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: ensureArray(prev.features).filter((_, i) => i !== index) }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.title) {
      setFormData(prev => ({ ...prev, benefits: [...ensureArray(prev.benefits), newBenefit] }));
      setNewBenefit({ title: '', description: '' });
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({ ...prev, benefits: ensureArray(prev.benefits).filter((_, i) => i !== index) }));
  };

  const handleAddTag = () => {
    if (newTag && !ensureArray(formData.tags).includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...ensureArray(prev.tags), newTag] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: ensureArray(prev.tags).filter(t => t !== tagToRemove) }));
  };

  const handleAddPricingTier = () => {
    const tierToAdd: PricingTier = { 
        ...newPricingTier,
        price: Number(newPricingTier.price) || 0
    };
    if (tierToAdd.name) {
        setFormData(prev => ({ ...prev, pricing_model: [...ensureArray(prev.pricing_model), tierToAdd] }));
        setNewPricingTier({ name: '', price: 0, billingCycle: 'monthly', description: '' });
        toast({ title: "Tier Added", description: "Pricing tier added to the form. Save changes to persist."}) 
    } else {
        toast({ title: "Missing Name", description: "Please enter a name for the new pricing tier.", variant: "destructive"}) 
    }
  };

  const handleRemovePricingTier = (index: number) => {
    setFormData(prev => ({ ...prev, pricing_model: ensureArray(prev.pricing_model).filter((_, i) => i !== index) }));
  };

  const handlePricingTierChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, index: number) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        pricing_model: ensureArray(prev.pricing_model).map((tier, i) => 
            i === index ? { ...tier, [name]: name === 'price' ? parseFloat(value) || 0 : value } : tier
        )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, ...updatesToSave } = formData;
      console.log("[ProductDetail] Saving updates for product:", productId, updatesToSave);
      await updateProduct(productId, updatesToSave as ProductInput);
      setIsEditing(false);
      toast({ title: "Product Updated", description: "Your product has been updated successfully." });
    } catch (error: any) {
      console.error("[ProductDetail] Error saving product:", error);
      toast({ title: "Save Error", description: `Failed to update product: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
      toast({ title: "Product Deleted", description: "Your product has been deleted successfully." });
      router.push("/products");
    } catch (error: any) {
      console.error("[ProductDetail] Error deleting product:", error);
      toast({ title: "Delete Error", description: `Failed to delete product: ${error.message}`, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      if (product) {
          console.log("[ProductDetail] Canceling edit, resetting form data.");
          setFormData({
            id: product.id,
            name: product.name || '',
            description: product.description || '',
            website_url: product.website_url || '',
            features: ensureArray(product.features).map(f => ({...f})),
            benefits: ensureArray(product.benefits).map(b => ({...b})),
            tags: ensureArray(product.tags).slice(),
            standard_scope: product.standard_scope || '',
            pricing_model: ensureArray(product.pricing_model).map(p => ({...p})),
          });
      } else {
          setFormData({});
      }
  };

  if (productsLoading && !product && !initialFetchAttempted) {
    return (
        <div className="container py-6 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product...</span>
        </div>
    );
  }

  if (!product && initialFetchAttempted) {
    return (
      <div className="container py-6">
        <div className="bg-red-500/20 text-red-500 p-4 rounded-md">
          Product not found. It may have been deleted or is unavailable.
        </div>
        <div className="mt-4">
          <NextLink href="/products">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </NextLink>
        </div>
      </div>
    );
  }
  
  if (!product || !formData.id) {
      return (
        <div className="container py-6 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Initializing...</span>
        </div>
      );
  }

  const displayData = isEditing ? formData : product;
  
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <NextLink href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </NextLink>
          <h1 className="text-2xl font-bold ml-4">
              {isEditing ? "Edit Product" : product.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone and will permanently delete this product.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { }}> 
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Product"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={4} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="website_url">Website URL</Label>
                <Input id="website_url" name="website_url" value={formData.website_url || ''} onChange={handleChange} placeholder="https://example.com" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Features</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ensureArray(formData.features).map((feature, index) => (
                <div key={`feature-${index}`} className="flex gap-4 items-start border rounded-md p-3">
                    <div className="flex-1">
                        <div className="font-medium">{feature.title}</div>
                        <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFeature(index)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                  <Input placeholder="New feature title" value={newFeature.title} onChange={(e) => setNewFeature({...newFeature, title: e.target.value})} />
                  <Input placeholder="New feature description" value={newFeature.description} onChange={(e) => setNewFeature({...newFeature, description: e.target.value})} />
                  <Button type="button" onClick={handleAddFeature} variant="secondary">Add Feature</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle>Benefits</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  {ensureArray(formData.benefits).map((benefit, index) => (
                      <div key={`benefit-${index}`} className="flex gap-4 items-start border rounded-md p-3">
                          <div className="flex-1">
                              <div className="font-medium">{benefit.title}</div>
                              <div className="text-sm text-muted-foreground">{benefit.description}</div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBenefit(index)}><X className="h-4 w-4" /></Button>
                      </div>
                  ))}
                   <div className="flex gap-2 pt-4 border-t">
                      <Input placeholder="New benefit title" value={newBenefit.title} onChange={(e) => setNewBenefit({...newBenefit, title: e.target.value})} />
                      <Input placeholder="New benefit description" value={newBenefit.description} onChange={(e) => setNewBenefit({...newBenefit, description: e.target.value})} />
                      <Button type="button" onClick={handleAddBenefit} variant="secondary">Add Benefit</Button>
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                      {ensureArray(formData.tags).map((tag) => (
                          <div key={tag} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                              {tag}
                              <button 
                                type="button"
                                className="h-4 w-4 p-0 ml-1 opacity-50 hover:opacity-100 hover:bg-transparent" 
                                onClick={() => handleRemoveTag(tag)}
                              >
                                  <X className="h-3 w-3" />
                              </button>
                          </div>
                      ))}
                  </div>
                   <div className="flex gap-2 pt-4 border-t">
                      <Input placeholder="Add new tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}/>
                      <Button type="button" onClick={handleAddTag} variant="secondary">Add Tag</Button>
                  </div>
              </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Standard Scope</CardTitle></CardHeader>
            <CardContent>
                <Textarea name="standard_scope" value={formData.standard_scope || ''} onChange={handleChange} rows={4} placeholder="Describe what is typically included..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing Tiers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ensureArray(formData.pricing_model).map((tier, index) => (
                  <div key={`pricing-${index}`} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center border rounded-md p-3">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                          <Label htmlFor={`edit-tier-name-${index}`}>Name</Label>
                          <Input id={`edit-tier-name-${index}`} name="name" value={tier.name} onChange={(e) => handlePricingTierChange(e, index)} placeholder="Tier name" />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-1">
                          <Label htmlFor={`edit-tier-price-${index}`}>Price</Label>
                          <Input id={`edit-tier-price-${index}`} name="price" type="number" min="0" step="0.01" value={tier.price} onChange={(e) => handlePricingTierChange(e, index)} placeholder="0.00" />
                      </div>
                      <div className="col-span-6 md:col-span-4 space-y-1">
                          <Label htmlFor={`edit-tier-cycle-${index}`}>Billing Cycle</Label>
                          <select 
                              id={`edit-tier-cycle-${index}`} 
                              name="billingCycle" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                              value={tier.billingCycle}
                              onChange={(e) => handlePricingTierChange(e, index)}
                          >
                              <option value="one-time">One-time</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                              <option value="custom">Custom</option>
                          </select>
                      </div>
                      <div className="col-span-12 md:col-span-1 flex items-end justify-end md:pb-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePricingTier(index)}><X className="h-4 w-4" /></Button>
                      </div>
                      <div className="col-span-12 space-y-1">
                          <Label htmlFor={`edit-tier-desc-${index}`}>Description</Label>
                          <Textarea id={`edit-tier-desc-${index}`} name="description" value={tier.description || ''} onChange={(e) => handlePricingTierChange(e, index)} placeholder="Tier description" rows={2} />
                      </div>
                  </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 items-end pt-4 border-t">
                  <Input className="flex-grow" placeholder="New tier name" value={newPricingTier.name} onChange={(e) => setNewPricingTier({...newPricingTier, name: e.target.value})} />
                  <Input type="number" placeholder="Price" value={newPricingTier.price} onChange={(e) => setNewPricingTier({...newPricingTier, price: Number(e.target.value)})} />
                  <select 
                     name="billingCycle" 
                     className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ..." 
                     value={newPricingTier.billingCycle} 
                     onChange={(e) => setNewPricingTier({...newPricingTier, billingCycle: e.target.value as PricingTier['billingCycle']})}
                  >
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom</option>
                  </select>
                  <Input className="flex-grow" placeholder="Description" value={newPricingTier.description} onChange={(e) => setNewPricingTier({...newPricingTier, description: e.target.value})} />
                  <Button type="button" onClick={handleAddPricingTier} variant="secondary" className="whitespace-nowrap">Add Tier</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {product.description && <p className="text-muted-foreground">{product.description}</p>}
              {product.website_url && 
                <p><strong>Website:</strong> <NextLink href={product.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{product.website_url}</NextLink></p>}
            </CardContent>
          </Card>

          {ensureArray(product.features).length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Features</CardTitle></CardHeader>
                  <CardContent>
                      <ul className="list-disc space-y-2 pl-5">
                          {ensureArray(product.features).map((f, i) => <li key={`view-f-${i}`}><strong>{f.title}:</strong> {f.description}</li>)}
                      </ul>
                  </CardContent>
              </Card>
          )}

          {ensureArray(product.benefits).length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Benefits</CardTitle></CardHeader>
                  <CardContent>
                      <ul className="list-disc space-y-2 pl-5">
                          {ensureArray(product.benefits).map((b, i) => <li key={`view-b-${i}`}><strong>{b.title}:</strong> {b.description}</li>)}
                      </ul>
                  </CardContent>
              </Card>
          )}
          
          {ensureArray(product.tags).length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                      {ensureArray(product.tags).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </CardContent>
              </Card>
          )}
          
          {product.standard_scope && (
              <Card>
                  <CardHeader><CardTitle>Standard Scope</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{product.standard_scope}</p></CardContent>
              </Card>
          )}

          {ensureArray(product.pricing_model).length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      {ensureArray(product.pricing_model).map((tier, i) => (
                          <div key={`view-p-${i}`} className="border-b pb-3 last:border-b-0">
                              <div className="flex justify-between items-baseline">
                                  <h4 className="font-semibold text-lg">{tier.name}</h4>
                                  <p className="text-xl font-bold">${(Number(tier.price) || 0).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/{tier.billingCycle}</span></p>
                              </div>
                              {tier.description && <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>}
                          </div>
                      ))}
                  </CardContent>
              </Card>
          )}
        </div>
      )}
    </div>
  );
} 