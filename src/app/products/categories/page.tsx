"use client";

import { useEffect, useState } from "react";
import { ProductNav } from "@/components/products/ProductNav";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductCategoriesPage() {
  const { categories, isLoading, error, fetchCategories, addCategory } = useProductStore();
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    fetchCategories();
    setIsClient(true);
  }, [fetchCategories]);

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating category with data:", newCategory);
      await addCategory(newCategory);
      setNewCategory({ name: "", description: "" });
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  };

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
              <h1 className="text-2xl font-bold">Product Categories</h1>
              <p className="text-muted-foreground">
                Organize your products and services into categories
              </p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex gap-2 items-center">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Category</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category to organize your products
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="e.g., Software, Services, Consulting"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      placeholder="Describe this category..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="z-50">
                  <Button variant="outline" onClick={() => setIsOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateCategory();
                    }} 
                    type="button"
                    className="relative z-50"
                  >
                    Create Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div>Loading categories...</div>
          ) : error ? (
            <div className="flex justify-center p-8">
              <div className="bg-red-500/20 text-red-500 p-4 rounded-md">
                Error loading categories: {error}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Create categories to organize your products and make them easier to find.
              </p>
              <Button onClick={() => setIsOpen(true)}>
                Add your first category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">
                      {category.description || "No description provided"}
                    </p>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 