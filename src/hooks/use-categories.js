"use client";

import { useMockData } from "@/lib/mock-store";

export function useCategories(typeFilter) {
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useMockData();
  const filtered = typeFilter ? categories.filter((c) => c.type === typeFilter) : categories;

  return {
    categories: filtered,
    allCategories: categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
